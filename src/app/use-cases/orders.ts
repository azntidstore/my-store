import { Firestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { OrderStatus } from '@/lib/types';

/**
 * Updates the status of an existing order in Firestore.
 * @param db The Firestore instance.
 * @param orderId The ID of the order to update.
 * @param newStatus The new status for the order.
 */
export async function updateOrderStatus(db: Firestore, orderId: string, newStatus: OrderStatus): Promise<void> {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(), // Optionally track updates
    });
}
