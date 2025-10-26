import { Firestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { MessageStatus } from '@/lib/types';

/**
 * Updates the status of a message in Firestore.
 * @param db The Firestore instance.
 * @param messageId The ID of the message to update.
 * @param newStatus The new status for the message.
 */
export async function updateMessageStatus(db: Firestore, messageId: string, newStatus: MessageStatus): Promise<void> {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
        status: newStatus,
        updatedAt: serverTimestamp(), // Optionally track updates
    });
}
