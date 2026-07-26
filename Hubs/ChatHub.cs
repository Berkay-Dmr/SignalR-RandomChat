using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace RandomChatApp.Hubs
{
    public class ChatHub : Hub
    {
        private static ConcurrentQueue<string> waitingUsers = new ConcurrentQueue<string>();
        private static ConcurrentDictionary<string, string> userRooms = new ConcurrentDictionary<string, string>();
        
        // YENİ: Aramayı iptal edenlerin kaydını tuttuğumuz liste
        private static ConcurrentDictionary<string, bool> canceledUsers = new ConcurrentDictionary<string, bool>();

        public async Task FindMatch()
        {
            var currentUserId = Context.ConnectionId;

            // Kullanıcı yeniden eşleşmeye basarsa, iptal listesinden çıkarıyoruz
            canceledUsers.TryRemove(currentUserId, out _);

            // Kuyrukta biri varsa ve sıradaki kişi iptal etmediyse eşleştir
            while (waitingUsers.TryDequeue(out var partnerId))
            {
                if (partnerId == currentUserId) continue;

                // YENİ: Kuyruktan çektiğimiz kişi daha önce "Ayrıl" dediyse onu atla
                if (canceledUsers.TryGetValue(partnerId, out bool isCanceled) && isCanceled)
                {
                    canceledUsers.TryRemove(partnerId, out _);
                    continue; 
                }

                // Eşleşme sağlandı
                var roomName = Guid.NewGuid().ToString();
                await Groups.AddToGroupAsync(currentUserId, roomName);
                await Groups.AddToGroupAsync(partnerId, roomName);
                userRooms.TryAdd(currentUserId, roomName);
                userRooms.TryAdd(partnerId, roomName);

                await Clients.Group(roomName).SendAsync("MatchFound");
                return;
            }

            // Kuyrukta uygun kimse yoksa bu kullanıcıyı sıraya ekle
            waitingUsers.Enqueue(currentUserId);
        }

        // YENİ: Aramayı iptal etme butonu
        public async Task CancelMatch()
        {
            var currentUserId = Context.ConnectionId;
            canceledUsers.TryAdd(currentUserId, true);
        }

        // YENİ: Yazıyor... sinyalini karşı tarafa iletme
        public async Task Typing()
        {
            var currentUserId = Context.ConnectionId;
            if (userRooms.TryGetValue(currentUserId, out var roomName))
            {
                await Clients.OthersInGroup(roomName).SendAsync("ShowTyping");
            }
        }

        public async Task SendMessage(string message)
        {
            var currentUserId = Context.ConnectionId;
            if (userRooms.TryGetValue(currentUserId, out var roomName))
            {
                await Clients.OthersInGroup(roomName).SendAsync("ReceiveMessage", message);
            }
        }

        public async Task LeaveMatch()
        {
            var currentUserId = Context.ConnectionId;
            if (userRooms.TryRemove(currentUserId, out var roomName))
            {
                await Groups.RemoveFromGroupAsync(currentUserId, roomName);
                await Clients.OthersInGroup(roomName).SendAsync("PartnerLeft");
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var currentUserId = Context.ConnectionId;
            if (userRooms.TryRemove(currentUserId, out var roomName))
            {
                await Clients.OthersInGroup(roomName).SendAsync("PartnerLeft");
            }
            // Beklerken sekme kapanırsa iptal listesine ekle
            canceledUsers.TryAdd(currentUserId, true);
            await base.OnDisconnectedAsync(exception);
        }
    }
}