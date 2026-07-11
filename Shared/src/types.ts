export type UserRole = 'student' | 'admin';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  college: string;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type GigStatus = 'open' | 'accepted' | 'completed' | 'cancelled';

export interface IGig {
  _id: string;
  posterId: string; // User ID
  acceptedById?: string; // User ID
  title: string;
  description: string;
  price: number;
  category: string;
  status: GigStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type RentalStatus = 'available' | 'rented' | 'maintenance';

export interface IRental {
  _id: string;
  ownerId: string; // User ID
  title: string;
  description: string;
  pricePerDay: number;
  category: string;
  status: RentalStatus;
  availabilityCalendar: string[]; // List of ISO date strings representing rented days
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = 'gig' | 'rental';
export type TransactionStatus = 'pending' | 'held_in_escrow' | 'completed' | 'cancelled';

export interface ITransaction {
  _id: string;
  type: TransactionType;
  gigId?: string; // Gig ID if gig
  rentalId?: string; // Rental ID if rental
  buyerId: string; // User ID accepting gig / renting item
  sellerId: string; // User ID posting gig / owning item
  amount: number;
  status: TransactionStatus;
  rentalStartDate?: Date;
  rentalEndDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  body: string;
  sentAt: Date;
  read: boolean;
}

export interface IRating {
  _id: string;
  transactionId: string;
  raterId: string;
  rateeId: string;
  stars: number; // 1 to 5
  comment?: string;
  createdAt: Date;
}

export type NotificationType = 'gig_accepted' | 'gig_completed' | 'rental_booked' | 'rental_returned' | 'new_message' | 'new_rating' | 'system';

export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  payload: {
    title: string;
    message: string;
    referenceId?: string; // e.g. Gig ID, Transaction ID, Message sender
    referenceType?: 'gig' | 'rental' | 'transaction' | 'chat';
  };
  read: boolean;
  createdAt: Date;
}

export interface ICategory {
  _id: string;
  name: string;
  type: 'gig' | 'rental';
  icon?: string;
}
