# SignalR Random Chat

ASP.NET Core SignalR kullanılarak geliştirilmiş, veritabanı bağımlılığı olmayan (tamamen in-memory çalışan) gerçek zamanlı anonim sohbet uygulaması.

## Mimari ve Altyapı

Proje, HTTP'nin hantal yapısından sıyrılarak WebSocket protokolü üzerinden çift yönlü ve anlık iletişim sağlar. Yüksek anlık trafiği yönetebilmek ve "race condition" (yarış durumu) hatalarını önlemek için arka planda tamamen iş parçacığı güvenli (thread-safe) koleksiyonlar kullanılmıştır.

* **Eşleştirme Motoru:** Kullanıcılar `ConcurrentQueue` yapısında sıraya alınır. Eşleşme sağlandığında SignalR *Groups* özelliği ile rastgele üretilen izole bir odaya (Guid) çekilirler.
* **Durum Yönetimi:** Aktif sohbet odaları ve iptal durumları `ConcurrentDictionary` ile RAM üzerinde O(1) karmaşıklığında yönetilir. MS SQL gibi disk tabanlı veritabanlarına ihtiyaç duyulmaz.
* **Kopma Toleransı:** Kullanıcı sekmeyi kapattığında veya bağlantısı koptuğunda, SignalR'ın `OnDisconnectedAsync` metodu tetiklenerek karşı tarafa anında bilgi geçilir ve odalar temizlenir.

## Öne Çıkan Özellikler

- **Gerçek Zamanlı Eşleşme:** Bekleme sırasındaki kullanıcıların anında birbirine bağlanması.
- **Yazıyor İndikatörü (Typing Event):** İstemci klavye hareketlerinin sunucu üzerinden karşı uca anlık iletilmesi.
- **Arama İptali & Kapanma Kontrolü:** Kuyruktayken aramayı iptal edenlerin asenkron olarak sıradan düşürülmesi.
- **Modern Arayüz (Glassmorphism):** Saf HTML/CSS/JS ile yazılmış, cam efekti ve akıcı animasyonlara sahip dinamik UI.

## Kullanılan Teknolojiler

- **Backend:** C#, .NET 8.0, ASP.NET Core SignalR
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Veri Yapıları:** `ConcurrentQueue<T>`, `ConcurrentDictionary<TKey, TValue>`

## Kurulum ve Çalıştırma

Projeyi lokalinizde çalıştırmak için .NET SDK'nın bilgisayarınızda kurulu olması gerekmektedir.

1. Repoyu klonlayın:
   ```bash
   git clone [https://github.com/Berkay-Dmr/SignalR-RandomChat.git](https://github.com/Berkay-Dmr/SignalR-RandomChat.git)
