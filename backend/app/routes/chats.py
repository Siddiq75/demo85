from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import Message, Customer
from app.schemas import MessageCreate, MessageResponse, ConversationListItem

router = APIRouter(prefix="/chats", tags=["Chat & Messages Management"])

@router.post("/send", response_model=MessageResponse)
def send_message(msg: MessageCreate, db: Session = Depends(get_db)):
    db_msg = Message(
        tailor_id=msg.tailor_id,
        customer_phone=msg.customer_phone,
        sender=msg.sender,
        message_text=msg.message_text,
        is_read=False
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg

@router.get("/history", response_model=List[MessageResponse])
def get_chat_history(
    tailor_id: int,
    customer_phone: str,
    db: Session = Depends(get_db)
):
    messages = db.query(Message).filter(
        and_(
            Message.tailor_id == tailor_id,
            Message.customer_phone == customer_phone
        )
    ).order_by(Message.timestamp.asc()).all()
    return messages

@router.get("/conversations", response_model=List[ConversationListItem])
def get_conversations(
    tailor_id: int,
    db: Session = Depends(get_db)
):
    # 1. Fetch all registered customers for this tailor
    customers = db.query(Customer).filter(Customer.tailor_id == tailor_id).all()
    
    # 2. Compile conversations metadata
    results = []
    for customer in customers:
        # Get last message
        last_msg = db.query(Message).filter(
            and_(
                Message.tailor_id == tailor_id,
                Message.customer_phone == customer.phone
            )
        ).order_by(Message.timestamp.desc()).first()
        
        # Get unread message count (sent by customer to tailor)
        unread_count = db.query(Message).filter(
            and_(
                Message.tailor_id == tailor_id,
                Message.customer_phone == customer.phone,
                Message.sender == "customer",
                Message.is_read == False
            )
        ).count()
        
        results.append({
            "customer_id": customer.id,
            "name": customer.name,
            "phone": customer.phone,
            "last_message": last_msg.message_text if last_msg else None,
            "last_message_timestamp": last_msg.timestamp if last_msg else None,
            "last_message_sender": last_msg.sender if last_msg else None,
            "unread_count": unread_count
        })
        
    # Sort conversations: chats with messages first (sorted by newest message timestamp desc),
    # then chats with no messages sorted alphabetically by name
    results.sort(
        key=lambda x: (
            x["last_message_timestamp"].timestamp() if x["last_message_timestamp"] else 0,
            x["name"]
        ),
        reverse=True
    )
    return results

@router.post("/read")
def mark_as_read(
    tailor_id: int,
    customer_phone: str,
    reader: str,  # 'tailor' or 'customer'
    db: Session = Depends(get_db)
):
    # If the tailor is the reader, mark messages sent by customer as read
    # If the customer is the reader, mark messages sent by tailor as read
    sender_to_read = "customer" if reader == "tailor" else "tailor"
    
    db.query(Message).filter(
        and_(
            Message.tailor_id == tailor_id,
            Message.customer_phone == customer_phone,
            Message.sender == sender_to_read,
            Message.is_read == False
        )
    ).update({Message.is_read: True}, synchronize_session=False)
    
    db.commit()
    return {"status": "success"}
