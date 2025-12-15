import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { QuoteRepositoryImpl } from './quotes/quote.repository';
import { disconnectTestDatabase, clearTestDatabase } from '../../shared/test/helpers/database_helper';
import { createQuoteFixture, createDraftQuoteFixture, createQuotedQuoteFixture } from '../../shared/test/fixtures/quote.fixture';
import { QuoteStatus, TripType } from '../../shared/constants';

// Mock logger to avoid console output in tests
vi.mock('../../shared/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('QuoteRepositoryImpl (Integration)', () => {
  let repository: QuoteRepositoryImpl;
  const TEST_DB_URI = process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/test_db';

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) {
      await mongoose.connect(TEST_DB_URI);
    }
    repository = new QuoteRepositoryImpl();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await clearTestDatabase();
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    // Clear database before each test
    await clearTestDatabase();
  });

  describe('create', () => {
    it('should create a new quote in the database', async () => {
      // Arrange
      const quote = createDraftQuoteFixture({
        quoteId: 'test-quote-1',
        userId: 'test-user-1',
      });

      // Act
      await repository.create(quote);

      // Assert
      const found = await repository.findById(quote.quoteId);
      expect(found).not.toBeNull();
      expect(found?.quoteId).toBe(quote.quoteId);
      expect(found?.userId).toBe(quote.userId);
      expect(found?.status).toBe(QuoteStatus.DRAFT);
    });
  });

  describe('findById', () => {
    it('should find a quote by ID', async () => {
      // Arrange
      const quote = createDraftQuoteFixture({
        quoteId: 'test-quote-2',
        userId: 'test-user-1',
      });
      await repository.create(quote);

      // Act
      const found = await repository.findById(quote.quoteId);

      // Assert
      expect(found).not.toBeNull();
      expect(found?.quoteId).toBe(quote.quoteId);
    });

    it('should return null if quote does not exist', async () => {
      // Act
      const found = await repository.findById('non-existent-id');

      // Assert
      expect(found).toBeNull();
    });
  });

  describe('updateById', () => {
    it('should update a quote by ID', async () => {
      // Arrange
      const quote = createDraftQuoteFixture({
        quoteId: 'test-quote-3',
        userId: 'test-user-1',
      });
      await repository.create(quote);

      // Act
      await repository.updateById(quote.quoteId, {
        status: QuoteStatus.SUBMITTED,
        tripName: 'Updated Trip Name',
      });

      // Assert
      const updated = await repository.findById(quote.quoteId);
      expect(updated?.status).toBe(QuoteStatus.SUBMITTED);
      expect(updated?.tripName).toBe('Updated Trip Name');
    });
  });

  describe('findByUserId', () => {
    it('should find all quotes for a user', async () => {
      // Arrange
      const userId = 'test-user-2';
      const quote1 = createDraftQuoteFixture({
        quoteId: 'test-quote-4',
        userId,
      });
      const quote2 = createQuotedQuoteFixture({
        quoteId: 'test-quote-5',
        userId,
      });
      const quote3 = createDraftQuoteFixture({
        quoteId: 'test-quote-6',
        userId: 'different-user',
      });

      await repository.create(quote1);
      await repository.create(quote2);
      await repository.create(quote3);

      // Act
      const quotes = await repository.findByUserId(userId);

      // Assert
      expect(quotes).toHaveLength(2);
      expect(quotes.every((q) => q.userId === userId)).toBe(true);
      expect(quotes.every((q) => !q.isDeleted)).toBe(true);
    });
  });

  describe('findByStatus', () => {
    it('should find all quotes with a specific status', async () => {
      // Arrange
      const quote1 = createDraftQuoteFixture({
        quoteId: 'test-quote-7',
        userId: 'test-user-3',
      });
      const quote2 = createDraftQuoteFixture({
        quoteId: 'test-quote-8',
        userId: 'test-user-4',
      });
      const quote3 = createQuotedQuoteFixture({
        quoteId: 'test-quote-9',
        userId: 'test-user-5',
      });

      await repository.create(quote1);
      await repository.create(quote2);
      await repository.create(quote3);

      // Act
      const drafts = await repository.findByStatus(QuoteStatus.DRAFT);

      // Assert
      expect(drafts).toHaveLength(2);
      expect(drafts.every((q) => q.status === QuoteStatus.DRAFT)).toBe(true);
    });
  });

  describe('findByUserIdAndStatus', () => {
    it('should find quotes by user ID and status', async () => {
      // Arrange
      const userId = 'test-user-6';
      const quote1 = createDraftQuoteFixture({
        quoteId: 'test-quote-10',
        userId,
      });
      const quote2 = createQuotedQuoteFixture({
        quoteId: 'test-quote-11',
        userId,
      });
      const quote3 = createDraftQuoteFixture({
        quoteId: 'test-quote-12',
        userId: 'different-user',
      });

      await repository.create(quote1);
      await repository.create(quote2);
      await repository.create(quote3);

      // Act
      const drafts = await repository.findByUserIdAndStatus(userId, QuoteStatus.DRAFT);

      // Assert
      expect(drafts).toHaveLength(1);
      expect(drafts[0]?.quoteId).toBe(quote1.quoteId);
      expect(drafts[0]?.status).toBe(QuoteStatus.DRAFT);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a quote', async () => {
      // Arrange
      const quote = createDraftQuoteFixture({
        quoteId: 'test-quote-13',
        userId: 'test-user-7',
      });
      await repository.create(quote);

      // Act
      await repository.softDelete(quote.quoteId);

      // Assert
      const found = await repository.findById(quote.quoteId);
      expect(found?.isDeleted).toBe(true);

      // Verify it's excluded from findByUserId
      const quotes = await repository.findByUserId(quote.userId);
      expect(quotes).toHaveLength(0);
    });
  });

  describe('findByTripType', () => {
    it('should find quotes by trip type', async () => {
      // Arrange
      const quote1 = createQuoteFixture({
        quoteId: 'test-quote-14',
        userId: 'test-user-8',
        tripType: TripType.ONE_WAY,
      });
      const quote2 = createQuoteFixture({
        quoteId: 'test-quote-15',
        userId: 'test-user-9',
        tripType: TripType.TWO_WAY,
      });
      const quote3 = createQuoteFixture({
        quoteId: 'test-quote-16',
        userId: 'test-user-10',
        tripType: TripType.ONE_WAY,
      });

      await repository.create(quote1);
      await repository.create(quote2);
      await repository.create(quote3);

      // Act
      const oneWayQuotes = await repository.findByTripType(TripType.ONE_WAY);

      // Assert
      expect(oneWayQuotes).toHaveLength(2);
      expect(oneWayQuotes.every((q) => q.tripType === TripType.ONE_WAY)).toBe(true);
    });
  });

  describe('deleteById', () => {
    it('should delete a quote by ID', async () => {
      // Arrange
      const quote = createDraftQuoteFixture({
        quoteId: 'test-quote-17',
        userId: 'test-user-11',
      });
      await repository.create(quote);

      // Act
      await repository.deleteById(quote.quoteId);

      // Assert
      const found = await repository.findById(quote.quoteId);
      expect(found).toBeNull();
    });
  });
});

