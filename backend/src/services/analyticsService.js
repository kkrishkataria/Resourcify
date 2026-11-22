import { bookingRepository } from '../repositories/bookingRepository.js';
import { resourceRepository } from '../repositories/resourceRepository.js';
import { slotLockRepository } from '../repositories/slotLockRepository.js';

export class AnalyticsService {
  /**
   * Generates comprehensive campus resource analytics and utilization metrics.
   */
  async getDashboardAnalytics() {
    const [bookings, resources, slotLocks] = await Promise.all([
      bookingRepository.getAll(),
      resourceRepository.getAll(),
      slotLockRepository.getAllLocks(),
    ]);

    const totalBookings = bookings.length;
    const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN').length;
    const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length;
    const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED').length;
    const noShowBookings = bookings.filter((b) => b.status === 'NO_SHOW').length;

    // Rate calculations
    const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;
    const noShowRate = totalBookings > 0 ? Math.round((noShowBookings / totalBookings) * 100) : 0;

    // Peak booking hours distribution (08:00 to 22:00)
    const hourCounts = {};
    for (let h = 8; h <= 21; h++) {
      const hourLabel = `${String(h).padStart(2, '0')}:00`;
      hourCounts[hourLabel] = 0;
    }

    for (const b of bookings) {
      if (b.status !== 'CANCELLED') {
        const startHour = b.startTime?.slice(0, 2);
        const label = `${startHour}:00`;
        if (hourCounts[label] !== undefined) {
          hourCounts[label]++;
        }
      }
    }

    const peakHours = Object.entries(hourCounts).map(([hour, count]) => ({
      hour,
      bookingsCount: count,
    }));

    // Resource-specific utilization
    const resourceUsageMap = new Map();
    for (const r of resources) {
      resourceUsageMap.set(r.id, {
        resourceId: r.id,
        name: r.name,
        category: r.category,
        capacity: r.capacity,
        bookingsCount: 0,
        occupiedSlotCount: 0,
      });
    }

    for (const b of bookings) {
      if (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'COMPLETED') {
        const entry = resourceUsageMap.get(b.resourceId);
        if (entry) {
          entry.bookingsCount++;
          entry.occupiedSlotCount += (b.slotKeys?.length || 1);
        }
      }
    }

    const resourceStats = Array.from(resourceUsageMap.values()).map((r) => {
      // Estimated theoretical daily slots = 28 slots (08:00 to 22:00) * days
      const estimatedTotalCapacity = 56; // 2-day baseline capacity
      const utilizationPercent = Math.min(100, Math.round((r.occupiedSlotCount / estimatedTotalCapacity) * 100));
      return {
        ...r,
        utilizationPercent,
      };
    });

    resourceStats.sort((a, b) => b.bookingsCount - a.bookingsCount);

    const topUtilizedResources = resourceStats.slice(0, 5);
    const underutilizedResources = [...resourceStats]
      .sort((a, b) => a.bookingsCount - b.bookingsCount)
      .slice(0, 5);

    // Category utilization
    const categoryMap = {};
    for (const r of resources) {
      if (!categoryMap[r.category]) {
        categoryMap[r.category] = { category: r.category, count: 0, bookingCount: 0 };
      }
      categoryMap[r.category].count++;
    }

    for (const b of bookings) {
      if (b.status !== 'CANCELLED' && categoryMap[b.resourceCategory]) {
        categoryMap[b.resourceCategory].bookingCount++;
      }
    }

    const categoryUtilization = Object.values(categoryMap).map((c) => ({
      category: c.category,
      resourceCount: c.count,
      bookingsCount: c.bookingCount,
      utilizationPercent: c.count > 0 ? Math.min(100, Math.round((c.bookingCount / (c.count * 10)) * 100)) : 0,
    }));

    // Overall utilization
    const totalPossibleSlots = resources.length * 28;
    const totalOccupiedSlots = slotLocks.length;
    const overallUtilizationRate = totalPossibleSlots > 0 ? Math.min(100, Math.round((totalOccupiedSlots / totalPossibleSlots) * 100)) : 0;

    // Recent 10 bookings
    const recentBookings = [...bookings]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 10);

    return {
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      overallUtilizationRate,
      cancellationRate,
      noShowRate,
      totalResources: resources.length,
      currentlyLockedSlots: slotLocks.length,
      peakHours,
      categoryUtilization,
      topUtilizedResources,
      underutilizedResources,
      recentBookings,
    };
  }
}

export const analyticsService = new AnalyticsService();
