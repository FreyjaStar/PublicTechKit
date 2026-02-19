export interface Booking {
  id: string;
  customerPhone: string;
  customerName?: string;
  serviceType?: string;
  dateTime?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  assignedStaff?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingDto {
  customerPhone: string;
  customerName?: string;
  serviceType?: string;
  dateTime?: string;
  notes?: string;
  assignedStaff?: string;
}

export interface UpdateBookingDto {
  customerName?: string;
  serviceType?: string;
  dateTime?: string;
  notes?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  assignedStaff?: string;
}
