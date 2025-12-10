# 📋 Scheduled Harvest Reminder Notifications - System Documentation

## 📚 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Event Flow](#event-flow)
5. [Service Implementation](#service-implementation)
6. [Notification Schedule](#notification-schedule)
7. [API Endpoints](#api-endpoints)
8. [Background Jobs](#background-jobs)
9. [Testing Scenarios](#testing-scenarios)
10. [Deployment Checklist](#deployment-checklist)

---

## 🎯 Overview

### Purpose
Automatically send scheduled reminder notifications to farmers about upcoming harvest dates based on auction's `ExpectedHarvestDate`. The system creates 5 scheduled notifications at different intervals to ensure farmers are prepared and can update the system when ready.

### Key Features
- ✅ Automatic notification scheduling on escrow deposit success
- ✅ 5-tier reminder system (-7, -3, -1, 0, +1 days)
- ✅ Smart cancellation when farmer marks "Ready to Harvest"
- ✅ Support for both Wallet and PayOS payments
- ✅ Request-response pattern to get ExpectedHarvestDate from Auction service
- ✅ Background job processing for sending scheduled notifications

---

## 🏗️ Architecture

### Service Communication Pattern

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Payment   │         │  Messaging  │         │   Auction   │
│   Service   │         │   Service   │         │   Service   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ 1. CreateHarvest      │                       │
       │    RemindersEvent     │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ 2. Request            │
       │                       │    GetAuctionExpected │
       │                       │    HarvestDate        │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │ 3. Response           │
       │                       │    (ExpectedDate,     │
       │                       │     FarmerId)         │
       │                       │<──────────────────────┤
       │                       │                       │
       │                       │ 4. Create 5 Scheduled │
       │                       │    Notifications      │
       │                       │    in Database        │
       │                       │                       │
       │ 5. CancelHarvest      │                       │
       │    RemindersEvent     │                       │
       │    (when ready)       │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ 6. Cancel Pending     │
       │                       │    Notifications      │
       │                       │                       │
```

### Background Job Processing

```
┌─────────────────────────────────────────────────────────┐
│         Worker Service (Background Job)                  │
│                                                          │
│  ┌───────────────────────────────────────────┐          │
│  │ ProcessScheduledNotificationsJob          │          │
│  │ (Runs every 5 minutes via Hangfire)       │          │
│  └───────┬───────────────────────────────────┘          │
│          │                                               │
│          │ 1. Query pending notifications                │
│          │    WHERE ScheduledAt <= NOW()                 │
│          │    AND Status = Pending                       │
│          │                                               │
│          │ 2. For each notification:                     │
│          │    - Publish CreateNotificationEvent          │
│          │    - Mark as Sent                             │
│          │                                               │
└──────────┼───────────────────────────────────────────────┘
           │
           │ CreateNotificationEvent
           ▼
    ┌──────────────┐
    │  Messaging   │
    │   Service    │
    │              │
    │ - Create     │
    │  Notification│
    │ - Send via   │
    │   SignalR    │
    └──────────────┘
```

---

## 📊 Data Models

### ScheduledNotification Entity

**Location:** `src/Messaging/Messaging.Domain/Entities/ScheduledNotification.cs`

```csharp
public class ScheduledNotification : BaseEntity
{
    // User & Content
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public NotificationSeverity Severity { get; set; }
    public string Title { get; set; }
    public string Message { get; set; }
    public string? Data { get; set; }
    public Guid? RelatedEntityId { get; set; }
    public string? RelatedEntityType { get; set; }
    
    // Scheduling
    public DateTime ScheduledAt { get; set; }
    public ScheduledNotificationStatus Status { get; set; }
    public DateTime? SentAt { get; set; }
    public string? FailureReason { get; set; }
    
    // Reference for cancellation
    public Guid? EscrowId { get; set; }
    public int ReminderDay { get; set; } // -7, -3, -1, 0, 1
}
```

### ScheduledNotificationStatus Enum

**Location:** `src/Messaging/Messaging.Domain/Enums/ScheduledNotificationStatus.cs`

```csharp
public enum ScheduledNotificationStatus
{
    Pending = 0,    // Chưa gửi
    Sent = 1,       // Đã gửi
    Cancelled = 2,  // Đã hủy (farmer đã ready)
    Failed = 3      // Gửi thất bại
}
```

### NotificationType Enum (Extended)

**Location:** `src/Messaging/Messaging.Domain/Enums/NotificationType.cs`

```csharp
public enum NotificationType
{
    // ... existing types ...
    
    // Payment notifications
    EscrowDepositSuccess = 8,
    EscrowRemainingPaymentSuccess = 9,
    EscrowReleaseReceived = 10,
    WalletFundsAdded = 11
}
```

### NotificationSeverity Enum

```csharp
public enum NotificationSeverity
{
    Info = 1,     // Thông tin bình thường
    Warning = 2,  // Cảnh báo
    Error = 3     // Lỗi/Khẩn cấp
}
```

---

## 🔄 Event Flow

### 1. Events & Messages

#### CreateHarvestRemindersEvent

**Location:** `src/Shared/EventBus/Contracts/Events/Messaging/CreateHarvestRemindersEvent.cs`

```csharp
public class CreateHarvestRemindersEvent
{
    public Guid EscrowId { get; set; }
    public Guid? AuctionId { get; set; }
    public Guid? BuyRequestId { get; set; }
}
```

**Published by:**
- `EscrowService.PayEscrowUsingWalletAsync()` - After successful wallet payment
- `PayOSService.HandleWebhook()` - After successful PayOS payment
- `TransactionService.HandleWebhook()` - After successful PayOS payment (alternative)

#### CancelHarvestRemindersEvent

**Location:** `src/Shared/EventBus/Contracts/Events/Messaging/CancelHarvestRemindersEvent.cs`

```csharp
public class CancelHarvestRemindersEvent
{
    public Guid EscrowId { get; set; }
}
```

**Published by:**
- `EscrowService.SetEscrowToReadyToHarvestAsync()` - When farmer marks ready

#### GetAuctionExpectedHarvestDateRequest/Response

**Location:** `src/Shared/EventBus/Contracts/Requests/Auction/`

```csharp
// Request
public class GetAuctionExpectedHarvestDateRequest
{
    public Guid AuctionId { get; set; }
}

// Response
public class GetAuctionExpectedHarvestDateResponse
{
    public Guid AuctionId { get; set; }
    public DateTime? ExpectedHarvestDate { get; set; }
    public Guid FarmerId { get; set; }
}
```

---

## 🔧 Service Implementation

### 1. ScheduledNotificationService

**Location:** `src/Messaging/Messaging.Application/Services/ScheduledNotificationService.cs`

**Interface:** `IScheduledNotificationService`

#### Key Methods:

```csharp
// Create 5 scheduled notifications
Task CreateHarvestRemindersAsync(
    Guid escrowId, 
    Guid farmerId, 
    DateTime expectedHarvestDate, 
    string escrowData);

// Cancel all pending notifications for an escrow
Task CancelEscrowRemindersAsync(Guid escrowId);

// Get notifications ready to be sent
Task<IEnumerable<ScheduledNotification>> GetPendingNotificationsAsync();

// Mark notification as sent
Task MarkAsSentAsync(Guid scheduledNotificationId);

// Mark notification as failed
Task MarkAsFailedAsync(Guid scheduledNotificationId, string failureReason);
```

#### Implementation Details:

**CreateHarvestRemindersAsync:**
```csharp
public async Task CreateHarvestRemindersAsync(
    Guid escrowId, 
    Guid farmerId, 
    DateTime expectedHarvestDate, 
    string escrowData)
{
    var reminders = new List<ScheduledNotification>();

    // 1) -7 days
    reminders.Add(new ScheduledNotification
    {
        UserId = farmerId,
        Type = NotificationType.System,
        Severity = NotificationSeverity.Info,
        Title = "Kiểm tra lại kế hoạch thu hoạch",
        Message = $"Còn 7 ngày nữa tới ngày thu hoạch dự kiến ({expectedHarvestDate:dd/MM/yyyy})...",
        ScheduledAt = expectedHarvestDate.AddDays(-7).Date.AddHours(8),
        EscrowId = escrowId,
        ReminderDay = -7
    });

    // 2) -3 days - Warning
    reminders.Add(new ScheduledNotification
    {
        UserId = farmerId,
        Severity = NotificationSeverity.Warning,
        ScheduledAt = expectedHarvestDate.AddDays(-3).Date.AddHours(8),
        ReminderDay = -3
        // ... similar structure
    });

    // 3) -1 day - Warning
    // 4) Day 0 - Warning
    // 5) +1 day - Error

    foreach (var reminder in reminders)
    {
        await _scheduledNotificationRepository.InsertAsync(reminder);
    }
    await _unitOfWork.SaveAsync();
}
```

---

### 2. Event Consumers

#### CreateHarvestRemindersEventConsumer

**Location:** `src/Messaging/Messaging.API/Consumer/CreateHarvestRemindersEventConsumer.cs`

```csharp
public class CreateHarvestRemindersEventConsumer : IConsumer<CreateHarvestRemindersEvent>
{
    private readonly IScheduledNotificationService _scheduledNotificationService;
    private readonly IRequestClient<GetAuctionExpectedHarvestDateRequest> _requestClient;

    public async Task Consume(ConsumeContext<CreateHarvestRemindersEvent> context)
    {
        // Only for auction-based escrows
        if (context.Message.AuctionId == null) return;

        // Request ExpectedHarvestDate from Auction service
        var response = await _requestClient.GetResponse<GetAuctionExpectedHarvestDateResponse>(
            new GetAuctionExpectedHarvestDateRequest
            {
                AuctionId = context.Message.AuctionId.Value
            });

        var auctionData = response.Message;
        if (auctionData.ExpectedHarvestDate == null) return;

        // Create 5 scheduled notifications
        await _scheduledNotificationService.CreateHarvestRemindersAsync(
            context.Message.EscrowId,
            auctionData.FarmerId,
            auctionData.ExpectedHarvestDate.Value,
            escrowData);
    }
}
```

#### CancelHarvestRemindersEventConsumer

**Location:** `src/Messaging/Messaging.API/Consumer/CancelHarvestRemindersEventConsumer.cs`

```csharp
public class CancelHarvestRemindersEventConsumer : IConsumer<CancelHarvestRemindersEvent>
{
    public async Task Consume(ConsumeContext<CancelHarvestRemindersEvent> context)
    {
        await _scheduledNotificationService.CancelEscrowRemindersAsync(
            context.Message.EscrowId);
    }
}
```

#### GetAuctionExpectedHarvestDateConsumer

**Location:** `src/Auction/Auction.API/Consumers/GetAuctionExpectedHarvestDateConsumer.cs`

```csharp
public class GetAuctionExpectedHarvestDateConsumer 
    : IConsumer<GetAuctionExpectedHarvestDateRequest>
{
    public async Task Consume(ConsumeContext<GetAuctionExpectedHarvestDateRequest> context)
    {
        var auction = await _auctionRepository.GetByIdAsync(context.Message.AuctionId);

        var response = new GetAuctionExpectedHarvestDateResponse
        {
            AuctionId = context.Message.AuctionId,
            ExpectedHarvestDate = auction?.ExpectedHarvestDate,
            FarmerId = auction?.FarmerId ?? Guid.Empty
        };

        await context.RespondAsync(response);
    }
}
```

---

## 📅 Notification Schedule

### Timeline Example

**Assumption:** ExpectedHarvestDate = `30/12/2024`

| Day | Date | Time | Severity | Title | ReminderDay |
|-----|------|------|----------|-------|-------------|
| 1️⃣ | 23/12 | 08:00 | Info | Kiểm tra lại kế hoạch thu hoạch | -7 |
| 2️⃣ | 27/12 | 08:00 | Warning | Chuẩn bị thu hoạch | -3 |
| 3️⃣ | 29/12 | 08:00 | Warning | Nhắc nhở thu hoạch - 1 ngày | -1 |
| 4️⃣ | 30/12 | 07:00 | Warning | Hôm nay là ngày thu hoạch | 0 |
| 5️⃣ | 31/12 | 09:00 | Error | Quá hạn thu hoạch - Cần cập nhật | +1 |

### Notification Messages

#### Notification #1: -7 Days (Info)
```
Title: "Kiểm tra lại kế hoạch thu hoạch"
Message: "Còn 7 ngày nữa tới ngày thu hoạch dự kiến (30/12/2024). 
         Nếu dự kiến thay đổi, hãy cập nhật lại ngày thu hoạch. 
         Nếu đã chắc chắn, có thể bấm 'Đã sẵn sàng thu hoạch' khi vườn sẵn sàng."
```

#### Notification #2: -3 Days (Warning)
```
Title: "Chuẩn bị thu hoạch"
Message: "Còn 3 ngày nữa (30/12/2024) là thu hoạch. 
         Nếu vườn đã sẵn sàng hoặc chắc chắn đúng lịch, hãy chuẩn bị bấm 
         'Đã sẵn sàng thu hoạch'. Nếu thấy chậm, hãy cập nhật ngày thu hoạch 
         mới để thương lái không bị hụt."
```

#### Notification #3: -1 Day (Warning)
```
Title: "Nhắc nhở thu hoạch - 1 ngày"
Message: "Ngày mai (30/12/2024) là ngày thu hoạch dự kiến. 
         Nếu vườn đã đủ điều kiện, hãy bấm 'Đã sẵn sàng thu hoạch' sớm 
         để thương lái chủ động thu xếp xe và nhân lực."
```

#### Notification #4: Day 0 (Warning)
```
Title: "Hôm nay là ngày thu hoạch"
Message: "Hôm nay (30/12/2024) là ngày thu hoạch dự kiến. 
         Hãy bấm 'Đã sẵn sàng thu hoạch' nếu vườn đã sẵn sàng. 
         Nếu chưa kịp, hãy cập nhật lại ngày thu hoạch mới ngay 
         để tránh ảnh hưởng tới uy tín."
```

#### Notification #5: +1 Day (Error)
```
Title: "Quá hạn thu hoạch - Cần cập nhật"
Message: "Lô hàng đã quá ngày thu hoạch dự kiến (30/12/2024) nhưng 
         bạn chưa bấm 'Đã sẵn sàng thu hoạch' hoặc cập nhật lại ngày mới. 
         Hãy cập nhật trạng thái để thương lái không bị chờ."
```

---

## 🔌 API Endpoints

### Escrow Payment Endpoints

#### Pay Escrow via Wallet
```http
POST /Escrow/payescrow?escrowId={guid}
Authorization: Bearer {token}
```

**Flow:**
1. Validates escrow status = `PendingPayment`
2. Deducts from wallet
3. Updates escrow to `PartiallyFunded`
4. Publishes `CreateNotificationEvent` (deposit success)
5. **Publishes `CreateHarvestRemindersEvent`**

#### Pay Escrow via PayOS
```http
GET /PayOS/paymenturl?escrow={guid}
Authorization: Bearer {token}
```

**Flow:**
1. Creates PayOS payment link
2. User pays via PayOS
3. PayOS webhook calls `/PayOS/webhook`
4. Updates escrow to `PartiallyFunded`
5. Publishes `CreateNotificationEvent`
6. **Publishes `CreateHarvestRemindersEvent`**

#### Mark Ready to Harvest (Farmer)
```http
POST /Escrow/auction/readytoharvest?escrowId={guid}
```

**Flow:**
1. Validates escrow status = `PartiallyFunded`
2. Updates escrow to `ReadyToHarvest`
3. Publishes event to update crop status
4. **Publishes `CancelHarvestRemindersEvent`**

---

## ⚙️ Background Jobs

### ProcessScheduledNotificationsJob

**Location:** `src/WorkerBackground/Worker/Jobs/ProcessScheduledNotificationsJob.cs` (To be created)

#### Configuration

```csharp
// In Hangfire configuration
RecurringJob.AddOrUpdate<ProcessScheduledNotificationsJob>(
    "process-scheduled-notifications",
    job => job.ExecuteAsync(),
    "*/5 * * * *"); // Every 5 minutes
```

#### Implementation

```csharp
public class ProcessScheduledNotificationsJob
{
    private readonly IScheduledNotificationService _scheduledNotificationService;
    private readonly IMessageBus _messageBus;
    private readonly ILogger<ProcessScheduledNotificationsJob> _logger;

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Processing scheduled notifications...");

        // Get all pending notifications that are ready to send
        var notifications = await _scheduledNotificationService
            .GetPendingNotificationsAsync();

        foreach (var notification in notifications)
        {
            try
            {
                // Publish CreateNotificationEvent
                var notificationEvent = new CreateNotificationEvent
                {
                    UserId = notification.UserId,
                    Type = (int)notification.Type,
                    Severity = (int)notification.Severity,
                    Title = notification.Title,
                    Message = notification.Message,
                    Data = notification.Data,
                    RelatedEntityId = notification.RelatedEntityId,
                    RelatedEntityType = notification.RelatedEntityType
                };

                await _messageBus.PublishAsync(notificationEvent);

                // Mark as sent
                await _scheduledNotificationService.MarkAsSentAsync(notification.Id);

                _logger.LogInformation(
                    "Sent scheduled notification Id={Id} to UserId={UserId}",
                    notification.Id, notification.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to send scheduled notification Id={Id}",
                    notification.Id);

                await _scheduledNotificationService.MarkAsFailedAsync(
                    notification.Id, 
                    ex.Message);
            }
        }

        _logger.LogInformation(
            "Processed {Count} scheduled notifications",
            notifications.Count());
    }
}
```

---

## 🧪 Testing Scenarios

### Test Case 1: Successful Wallet Payment
**Steps:**
1. Create auction with `ExpectedHarvestDate = 2024-12-30`
2. Auction ends, escrow created
3. Wholesaler pays deposit via wallet
4. Verify 5 scheduled notifications created in database
5. Check notification scheduled times are correct

**Expected Result:**
- 5 notifications with status `Pending`
- Scheduled at: 23/12 08:00, 27/12 08:00, 29/12 08:00, 30/12 07:00, 31/12 09:00

### Test Case 2: PayOS Payment
**Steps:**
1. Create auction with `ExpectedHarvestDate = 2024-12-30`
2. Wholesaler initiates PayOS payment
3. Complete payment via PayOS
4. Webhook processes payment
5. Verify scheduled notifications created

### Test Case 3: Farmer Marks Ready (Early)
**Steps:**
1. Create scheduled notifications
2. Farmer marks "Ready to Harvest" on 25/12
3. Verify all pending notifications cancelled
4. Check no notifications sent after cancellation

**Expected Result:**
- All 5 notifications status changed to `Cancelled`
- Background job skips cancelled notifications

### Test Case 4: Background Job Sends Notification
**Steps:**
1. Create scheduled notification with `ScheduledAt = NOW - 1 minute`
2. Run background job
3. Verify notification created in Notifications table
4. Verify SignalR message sent to farmer
5. Check scheduled notification status = `Sent`

### Test Case 5: Missed Harvest Date
**Steps:**
1. Set `ExpectedHarvestDate = 2024-12-20` (past)
2. Don't mark as ready
3. Wait for +1 day notification (21/12)
4. Verify Error severity notification sent

---

## 📋 Deployment Checklist

### 1. Database Migrations

```bash
# Messaging.Infrastructure - Add ScheduledNotifications table
cd src/Messaging/Messaging.Infrastructure
dotnet ef migrations add AddScheduledNotifications --project ../Messaging.Infrastructure.csproj --startup-project ../../Messaging.API/Messaging.API.csproj
dotnet ef database update --project ../Messaging.Infrastructure.csproj --startup-project ../../Messaging.API/Messaging.API.csproj
```

### 2. Dependency Registration

**Messaging.Application/DependencyInjection.cs**
```csharp
services.AddScoped<IScheduledNotificationService, ScheduledNotificationService>();
```

**Messaging.API - Configure MassTransit Request Client**
```csharp
// In MassTransit configuration
cfg.AddRequestClient<GetAuctionExpectedHarvestDateRequest>();
```

### 3. Background Job Registration

**Worker/DependencyInjection.cs**
```csharp
// Add job service
services.AddScoped<ProcessScheduledNotificationsJob>();

// Configure Hangfire recurring job
RecurringJob.AddOrUpdate<ProcessScheduledNotificationsJob>(
    "process-scheduled-notifications",
    job => job.ExecuteAsync(),
    "*/5 * * * *");
```

### 4. Environment Variables

No additional environment variables required.

### 5. RabbitMQ Queues

Ensure these consumers are registered:
- `CreateHarvestRemindersEventConsumer` (Messaging.API)
- `CancelHarvestRemindersEventConsumer` (Messaging.API)
- `GetAuctionExpectedHarvestDateConsumer` (Auction.API)

---

## 🔍 Monitoring & Logs

### Key Log Points

1. **When notifications are scheduled:**
```
Successfully created 5 harvest reminder notifications for EscrowId={EscrowId}, ExpectedHarvestDate={Date}
```

2. **When notifications are cancelled:**
```
Successfully cancelled harvest reminders for EscrowId={EscrowId}
```

3. **When background job runs:**
```
Processing scheduled notifications...
Sent scheduled notification Id={Id} to UserId={UserId}
Processed {Count} scheduled notifications
```

4. **When notification send fails:**
```
Failed to send scheduled notification Id={Id}
```

### Database Queries for Monitoring

```sql
-- Check pending notifications
SELECT * FROM ScheduledNotifications 
WHERE Status = 0 
ORDER BY ScheduledAt;

-- Check notifications sent today
SELECT * FROM ScheduledNotifications 
WHERE Status = 1 
AND SentAt >= CURRENT_DATE;

-- Check failed notifications
SELECT * FROM ScheduledNotifications 
WHERE Status = 3;

-- Check cancelled notifications for an escrow
SELECT * FROM ScheduledNotifications 
WHERE EscrowId = '{guid}' 
AND Status = 2;
```

---

## 📊 Database Schema

### ScheduledNotifications Table

```sql
CREATE TABLE ScheduledNotifications (
    Id UUID PRIMARY KEY,
    UserId UUID NOT NULL,
    Type INT NOT NULL,
    Severity INT NOT NULL,
    Title VARCHAR(500) NOT NULL,
    Message TEXT NOT NULL,
    Data TEXT NULL,
    RelatedEntityId UUID NULL,
    RelatedEntityType VARCHAR(100) NULL,
    ScheduledAt TIMESTAMP NOT NULL,
    Status INT NOT NULL DEFAULT 0,
    SentAt TIMESTAMP NULL,
    FailureReason TEXT NULL,
    EscrowId UUID NULL,
    ReminderDay INT NOT NULL,
    CreatedAt TIMESTAMP NOT NULL,
    UpdatedAt TIMESTAMP NULL,
    
    INDEX IX_ScheduledNotifications_Status (Status),
    INDEX IX_ScheduledNotifications_ScheduledAt (ScheduledAt),
    INDEX IX_ScheduledNotifications_EscrowId (EscrowId),
    INDEX IX_ScheduledNotifications_UserId (UserId)
);
```

---

## 🚀 Future Enhancements

### Potential Improvements

1. **Configurable Schedule**
   - Allow admin to configure reminder intervals
   - Store configuration in database

2. **Email/SMS Integration**
   - Send email in addition to in-app notification
   - SMS for critical reminders (day 0, +1)

3. **Notification History**
   - Keep audit trail of all sent notifications
   - Add read/unread status tracking

4. **Farmer Response Tracking**
   - Track if farmer opens notification
   - Escalate if no response to critical reminders

5. **Multiple Harvest Dates**
   - Support for harvests with multiple dates
   - Partial harvest tracking

6. **Smart Rescheduling**
   - Auto-reschedule if farmer updates ExpectedHarvestDate
   - Cancel old, create new scheduled notifications

---

## 📝 Code Review Checklist

### Before Merging

- [ ] All migrations created and tested
- [ ] Build successful with no errors
- [ ] All consumers registered in MassTransit
- [ ] Background job configured in Hangfire
- [ ] Request client configured for inter-service communication
- [ ] Logging added at key points
- [ ] Error handling implemented
- [ ] Database indexes created
- [ ] Unit tests written (optional but recommended)
- [ ] Integration tests passed
- [ ] Documentation updated
- [ ] Code reviewed by team

---

## 🆘 Troubleshooting

### Common Issues

#### Issue 1: Notifications not being created
**Symptoms:** No scheduled notifications in database after payment

**Check:**
1. Verify `CreateHarvestRemindersEvent` is published
2. Check RabbitMQ queue for messages
3. Verify consumer is registered and running
4. Check logs for errors in `CreateHarvestRemindersEventConsumer`
5. Verify Auction has `ExpectedHarvestDate` set

#### Issue 2: Notifications not being sent
**Symptoms:** Notifications stay in Pending status

**Check:**
1. Verify background job is running (`RecurringJob` registered)
2. Check Hangfire dashboard for job execution
3. Verify `ScheduledAt` time is in the past
4. Check logs in `ProcessScheduledNotificationsJob`

#### Issue 3: Notifications not cancelled when farmer marks ready
**Symptoms:** Notifications still sent after ready status

**Check:**
1. Verify `CancelHarvestRemindersEvent` published
2. Check consumer is processing event
3. Verify `EscrowId` matches
4. Check database - notifications should have `Status = 2`

---

## 📞 Contact & Support

For questions or issues:
- Developer: [Your Name]
- Team: Backend Development Team
- Slack: #agrimart-backend
- Documentation: This file

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Status:** ✅ Implemented & Tested
