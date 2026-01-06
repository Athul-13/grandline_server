export class DriverPayment {
    constructor(
        public readonly paymentId: string,
        public readonly driverId: string,
        public readonly reservationId: string,
        public readonly amount: number,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}
    
    /**
     * Get the payment ID
     * @returns The payment ID
     */
    getPaymentId(): string {
        return this.paymentId;
    }

    /**
     * Get the driver ID
     * @returns The driver ID
     */
    getDriverId(): string {
        return this.driverId;
    }   
}