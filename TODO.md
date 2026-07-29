# Room Bugs - Perbaikan TODO ✅

## Bug 1: Leader harus refresh untuk play lagu ✅

- [x] **File:** `client/songfact/src/pages/RoomPage.jsx`
  - Setelah `loadVideoById(videoId)`, langsung panggil `playVideo()` jika `isPlaying === true`

## Bug 2: Member list leader tidak real-time saat follower join ✅

- [x] **File:** `server/src/rooms/room.service.ts`
  - Di `joinRoom()`, broadcast `member:joined` ke room setelah member ditambahkan

## Bug 3: Progress bar follower tidak berjalan ✅

- [x] **File:** `server/src/rooms/room.service.ts`
  - Update interface `updatePlayback()` untuk include `duration`
- [x] **File:** `client/songfact/src/context/RoomContext.jsx`
  - Add `duration` state
  - Handle `duration` di event `playback:updated`
  - Export `setDuration` dan `duration`
- [x] **File:** `client/songfact/src/pages/RoomPage.jsx`
  - Leader: kirim `duration` via `updatePlayback()`
  - Follower: pakai `duration` dari server sebagai fallback

## Bug 4: Follower jadi leader tapi akses tidak terbuka ✅

- [x] **File:** `server/src/rooms/room.service.ts`
  - Di `leaveRoom()`, broadcast `newLeaderId` saat leadership transfer
- [x] **File:** `client/songfact/src/context/RoomContext.jsx`
  - Handle `member:left` dengan `newLeaderId`, refetch room jika user jadi leader baru
