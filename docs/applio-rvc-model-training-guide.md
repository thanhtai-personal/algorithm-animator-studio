# Huong dan train model giong ca nhan bang Applio/RVC

Tai lieu nay huong dan cach chuan bi dataset, train model trong Applio/RVC, va cung cap bo text de ban thu am giong that cua minh lam du lieu train.

Quan trong: audio train model nen la **giong that cua ban**. Khong nen dung audio tao boi Piper, ElevenLabs, Supertonic, hoac mot model AI khac de train "giong cua ban", vi model se hoc lai chat luong va loi cua nguon AI do.

Workflow dung:

```txt
Ban doc text mau va thu am
-> Cat/lam sach dataset
-> Applio preprocess
-> Extract features/F0
-> Train model
-> Train/create index
-> Test convert audio nguon sang giong cua ban
-> Cau hinh template Applio trong KAI STUDIO
```

---

## 1. Muc tieu dataset

Dataset tot cho narration/video can:

- Giong ro, it noise, khong nhac nen.
- Nhieu cau ngan va cau dai.
- Co dau cau, so, ten rieng, tu tieng Anh pho bien.
- Co nhieu am kho trong tieng Viet: tr/ch, s/x, r/d/gi, n/ng, l/n, uyen, uong, anh, ach.
- Toc do doc tu nhien, khong qua nhanh, khong dien kich qua muc.
- Volume on dinh, khong luc to luc nho.

Moc thoi luong khuyen nghi:

| Muc | Thoi luong sach | Dung khi |
| --- | --- | --- |
| Test nhanh | 5-10 phut | Kiem tra pipeline train/convert |
| Dung duoc | 20-30 phut | Voice-over video ca nhan |
| Tot hon | 45-60 phut | Giong on dinh hon, it meo hon |

Neu chi lam giong thuyet minh video, 20-30 phut audio sach thuong du de bat dau.

---

## 2. Chuan bi thu am

Thiet lap khuyen nghi:

- Thu trong phong yen tinh, tat quat/may lanh neu co tieng on.
- Dat mic cach mieng 15-25 cm.
- Dung pop filter neu co.
- Doc deu, khong can qua dien cam.
- Tranh clip/peaking: neu waveform cham tran lien tuc, giam gain.
- Nen thu WAV mono hoac stereo, 44.1 kHz/48 kHz, 16-bit hoac 24-bit.

Khong nen:

- Thu trong phong vang nhieu.
- De nhac nen, tieng game, tieng TV.
- Noi qua sat mic gay pop/bass qua day.
- Ghep nhieu ngay thu co mic/volume moi lan qua khac nhau.
- Dung audio da qua noise reduction qua manh lam giong bi kim loai.

---

## 3. Cau truc thu muc dataset

Tao mot thu muc rieng, vi du:

```txt
C:\DATA\voice-datasets\my_voice_raw
```

Dat file theo ten de kiem tra:

```txt
001_intro.wav
002_news.wav
003_story.wav
004_numbers.wav
005_football.wav
```

Sau khi cat/lam sach, dung thu muc processed rieng:

```txt
C:\DATA\voice-datasets\my_voice_clean
```

Moi file nen dai khoang 5-15 giay neu ban cat tay. Neu Applio co preprocess tu dong, co the dua file dai hon vao dataset raw va de Applio cat.

---

## 4. Train trong Applio

Ten tab trong Applio co the thay doi theo version. Neu UI khac, hay tim cac buoc co y nghia tuong duong: dataset/preprocess, feature extraction, train, index, inference.

1. Chay Applio:

```bat
C:\TOOLS\ApplioV3.6.2\run-applio.bat
```

2. Mo UI local, thuong la:

```txt
http://127.0.0.1:6969
```

3. Vao khu vuc **Training**.

4. Tao experiment/model moi:

```txt
Experiment/model name: my_voice
Dataset path: C:\DATA\voice-datasets\my_voice_raw
Sample rate: 40k hoac 48k
Version: RVC v2 neu co
F0/GPU: bat F0 neu train giong noi/hat co cao do
```

5. Chay **Preprocess dataset**.

6. Chay **Extract features** hoac **Extract F0/features**.

Thiet lap goi y cho voice-over:

```txt
F0 method: rmvpe
Hop le cho speech: rmvpe
Neu may yeu: harvest hoac crepe co the cham/hay khac tuy ban
```

7. Chay **Train model**.

Goi y ban dau:

```txt
Epochs: 100-200 cho dataset 20-30 phut
Save every epoch: 10 hoac 20
Batch size: tuy VRAM, bat dau 4-8 neu GPU yeu
```

Neu Applio co preset, dung preset mac dinh truoc. Dung co toi uu qua som. Hay train mot model chay duoc, test convert, roi moi chinh.

8. Tao **index**:

Sau khi train xong, chay train/create index neu Applio co nut rieng. File index thuong nam trong:

```txt
C:\TOOLS\ApplioV3.6.2\logs\my_voice\added_*.index
```

Model `.pth` co the nam trong:

```txt
C:\TOOLS\ApplioV3.6.2\assets\weights\my_voice.pth
```

Hoac:

```txt
C:\TOOLS\ApplioV3.6.2\logs\my_voice\*.pth
```

---

## 5. Test model trong Applio

Truoc khi cau hinh vao KAI STUDIO, test trong chinh Applio:

1. Vao **Inference/Convert**.
2. Chon model `.pth` vua train.
3. Chon file `.index` neu co.
4. Upload mot audio nguon sach, co the la Piper/Supertonic doc mot doan ngan.
5. Convert.

Tham so khoi dau:

```txt
Pitch: 0
F0 method: rmvpe
Index rate: 0.5-0.75
Protect: 0.33-0.5
Filter radius: 3
Output format: wav
```

Neu giong bi robot/re:

- Giam `index rate` ve 0.45-0.6.
- Tang `protect` len 0.45-0.5.
- Dung audio nguon doc cham hon.
- Kiem tra dataset co noise, vang phong, hoac clip khong.

Neu giong chua giong ban:

- Tang thoi luong dataset sach.
- Them cau doc gan dung use case: football news, video giai thich, truyen.
- Train them epoch, nhung dung train qua lau neu bat dau nghe bi meo.

---

## 6. Ket noi voi KAI STUDIO

Sau khi model test OK trong Applio:

1. Lay `Use via API` trong Applio.
2. Tao template trong Settings -> Voice -> Applio.
3. Dien model va index vao `RVC_APPLIO_TEMPLATES_JSON`.

Vi du:

```json
[
  {
    "id": "my-voice",
    "label": "Giong cua toi",
    "apiName": "/infer_convert",
    "modelName": "my_voice.pth",
    "indexPath": "C:/TOOLS/ApplioV3.6.2/logs/my_voice/added.index",
    "pitch": 0,
    "f0Method": "rmvpe",
    "indexRate": 0.65,
    "protect": 0.45,
    "filterRadius": 3,
    "argTemplate": [0, "${input}", "${model}", "${index}", "${f0_method}", "${index_rate}", "${filter_radius}", 0, 0.25, "${protect}", "wav"]
  }
]
```

Chi dung `argTemplate` minh hoa neu no khop voi **Use via API** tren may ban. Neu Applio cua ban co thu tu tham so khac, hay copy theo `client.predict(...)` cua chinh UI Applio.

Xem chi tiet template tai:

```txt
docs/applio-api-template-and-voice-text.md
```

---

## 7. Bo text thu am dataset tieng Viet

Cach dung:

- Doc bang giong that cua ban.
- Moi block co the thu thanh mot file rieng.
- Neu doc sai, dung lai 1-2 giay va doc lai cau do; sau nay cat bo phan sai.
- Khong can doc het trong mot lan. Tot nhat giu cung mic, cung phong, cung volume.

### Block 1: Gioi thieu va giong thuyet minh

```txt
Xin chao, day la bo du lieu thu am de train model giong ca nhan.

Toi se doc voi toc do vua phai, ro tung cau, giu am luong on dinh va khong noi qua nhanh.

Muc tieu cua bo thu am nay la tao ra mot giong doc tu nhien cho video thuyet minh, tin tuc bong da, va cac noi dung giai thich ngan gon.

Khi doc, toi se giu khoang nghi nhe giua cac cau. Neu co cau dai, toi se ngat hoi dung cho de nghe.

Day khong phai la mot man trinh dien. Day la giong noi binh thuong, ro rang, tu nhien, va de theo doi.
```

### Block 2: Tin tuc bong da

```txt
Tran dau toi qua dien ra voi toc do rat cao ngay tu nhung phut dau tien.

Doi chu nha chu dong day cao doi hinh, gay ap luc len hang tien ve doi phuong va lien tuc dua bong ra hai bien.

Phut thu muoi bay, tien dao so chin co pha di chuyen thong minh sau lung trung ve. Anh nhan duong chuyen dai, khong che bang chan phai, roi dut diem cheo goc.

Thu mon da bay nguoi het co, nhung bong van di sat cot doc va vao luoi.

Sau ban thang mo ty so, the tran tro nen cang thang hon. Doi khach buoc phai day cao, de lo nhieu khoang trong o phia sau hang phong ngu.

Neu duy tri duoc cuong do pressing va kha nang chuyen trang thai nhanh, doi chu nha co the tao ra them nhieu co hoi trong hiep hai.
```

### Block 3: Phan tich chien thuat

```txt
Diem dang chu y nam o cach doi bong to chuc khoi phong ngu tam giac ben canh trai.

Hau ve bien giu vi tri rong, tien ve trung tam lui xuong lam diem noi, con tien dao le di chuyen vao khoang trong giua hau ve bien va trung ve.

Khi bong duoc luan chuyen nhanh, doi phuong khong kip keo gian cu ly doi hinh. Dieu nay tao ra mot hanh lang tan cong rat ro.

Tuy nhien, chien thuat nay cung co rui ro. Neu mat bong o khu vuc giua san, khoang trong sau lung hau ve bien co the bi khai thac ngay lap tuc.

Vi vay, cau thu cam bong can ra quyet dinh nhanh: chuyen tiep, giu nhip, hay tra bong ve tuyen sau.
```

### Block 4: Giai thich cong nghe

```txt
Mot thuat toan tot khong chi can chay dung, ma con can de hieu, de kiem tra va de bao tri.

Khi giai thich mot bai toan, chung ta nen bat dau tu truc giac. Sau do moi di vao chi tiet ve du lieu, vong lap, dieu kien dung, va do phuc tap.

Vi du, voi sap xep noi bot, y tuong co ban la dua phan tu lon nhat ve cuoi mang sau moi luot duyet.

Thuat toan nay khong nhanh voi du lieu lon, nhung rat phu hop de minh hoa cach so sanh va hoan doi hoat dong.

Trong video, hinh anh truc quan se giup nguoi xem thay duoc vi sao tung buoc lai can thiet.
```

### Block 5: Truyen ngan va cam xuc nhe

```txt
Buoi sang hom do, thanh pho thuc day trong mot lop suong mong.

Tren con duong nho dan ra ben song, mot nguoi dan ong tre tuoi dung lai, lang nghe tieng gio thoi qua hang cay.

Anh khong voi va. Lan dau tien sau nhieu thang, anh cam thay minh co du thoi gian de nhin moi thu cham hon.

Mot chiec la roi xuong mat duong. Mot chuyen xe buyt di ngang qua. Va o dau do, tieng chuong nha tho vang len rat khe.

Co nhung khoanh khac khong can qua dac biet, nhung van du suc lam nguoi ta nho mai.
```

### Block 6: So, ngay thang, ten rieng

```txt
Bay gio toi se doc mot so cum co chu so va ten rieng de model hoc cach phat am ro hon.

Mot, hai, ba, bon, nam, sau, bay, tam, chin, muoi.

Muoi lam phut, hai muoi ba cau thu, bon muoi chin nghin khan gia, mot tram linh tam nghin luot xem.

Ngay hai muoi thang muoi mot nam hai nghin khong tram hai muoi sau.

Ty so la hai mot. Doi chu nha kiem soat bong nam muoi tam phan tram. Tong so cu sut la muoi hai, trong do co bon lan trung dich.

Manchester United, Liverpool, Arsenal, Chelsea, Tottenham, Barcelona, Real Madrid, Cristiano Ronaldo, Lionel Messi, Bruno Fernandes.
```

### Block 7: Am kho tieng Viet

```txt
Nguyen, Quyen, Huynh, Truong, Chien, Chuyen, Chuyen doi, Chuyen trang thai.

Sau sac, xanh xao, xuat sac, san sang, song song, sang suot.

Ranh gioi, danh gia, giai phap, du doan, du lieu, dieu kien, giao dien.

Luyen tap, lap lai, noi lieu, nong long, lang nghe, luu loat.

Khoang trong, kiem soat, phan cong, chong bong, thang hoa, quyet dinh.

Toi se doc cham lai mot chut de tung am duoc ro rang, sau do quay ve toc do binh thuong.
```

### Block 8: Cau hoi, nhan manh, va dau cau

```txt
Vi sao tinh huong nay lai quan trong?

Neu cau thu dut diem som hon, lieu ban thang co den khong?

Day la cau hoi ma nhieu nguoi ham mo se dat ra sau tran dau.

Hay nhin lai pha bong mot lan nua. Dau tien la duong chuyen cat tuyen, tiep theo la pha chay cho, va cuoi cung la cu sut vao goc xa.

Chinh khoanh khac do da thay doi cuc dien.

Khong on ao, khong phuc tap, nhung rat hieu qua.
```

### Block 9: Doc dai hon, nhip on dinh

```txt
Trong san xuat video, giong doc co vai tro rat quan trong. Mot hinh anh dep co the thu hut nguoi xem trong vai giay dau tien, nhung giong thuyet minh moi la thu giu cho mach noi dung duoc lien tuc.

Neu giong doc qua nhanh, nguoi xem khong kip xu ly thong tin. Neu giong doc qua cham, video se mat nang luong. Neu am thanh co nhieu tap am, nguoi xem se cam thay met moi, ngay ca khi noi dung duoc viet rat tot.

Vi vay, khi train model giong ca nhan, dieu quan trong nhat khong phai la doc that nhieu, ma la doc sach, doc deu, va doc dung phong cach minh muon su dung ve sau.

Neu ban muon lam video tin tuc bong da, hay them nhieu cau co ten cau thu, ty so, thoi gian, va cac tinh huong tren san.

Neu ban muon lam video giai thich cong nghe, hay them nhieu cau co thuat ngu, so lieu, va cau truc ly luan ro rang.
```

### Block 10: Ket thuc dataset

```txt
Day la phan cuoi cua bo thu am mau.

Toi se giu giong doc on dinh, phat am ro, va ket thuc moi cau bang khoang nghi ngan.

Sau khi thu xong, toi se nghe lai de loai bo nhung doan co tieng on, noi sai, bi vo am, hoac qua nho.

Mot dataset tot se giup model hoc giong tot hon, giam hien tuong meo tieng, va tao ra ket qua tu nhien hon khi chuyen voice bang Applio.

Ket thuc phan thu am.
```

---

## 8. Bo text bo sung tieng Anh va tu quoc te

Dung block nay neu video cua ban hay co ten tieng Anh, cau lac bo, cau thu, hoac thuat ngu cong nghe.

```txt
Hello, this is an additional recording block for English words and international names.

The goal is not to speak perfect English, but to make the voice model familiar with common sounds that appear in videos.

Manchester United, Liverpool, Arsenal, Chelsea, Tottenham Hotspur, Real Madrid, Barcelona, Bayern Munich, Paris Saint Germain.

Artificial intelligence, machine learning, source code, visual explanation, database, application, performance, rendering, browser, server, upload, download.

The final score was two to one. The team had sixty two percent possession, fifteen shots, and six attempts on target.

This sample should be read clearly, calmly, and at a natural pace.
```

---

## 9. Checklist chat luong truoc khi train

Truoc khi dua dataset vao Applio, kiem tra:

- Khong co nhac nen.
- Khong co tieng quat/may lanh qua ro.
- Khong bi clip/vo tieng.
- Khong co doan im lang qua dai.
- Khong co doan noi sai chua cat.
- Volume giua cac file khong chen nhau qua nhieu.
- Tong audio sach dat it nhat 10 phut cho test, tot hon la 20-30 phut.

Neu co thoi gian, nghe ngau nhien 5-10 file. Neu tai ban thay kho nghe, model cung se hoc kho.

---

## 10. Loi thuong gap khi train

### Model nghe giong nhung bi re

Nguyen nhan thuong gap:

- Dataset co noise hoac phong vang.
- Audio nguon convert qua nhanh/qua cao.
- `index rate` qua cao.
- `protect` qua thap.

Thu:

```txt
Index rate: 0.45-0.65
Protect: 0.45-0.5
Speech rate audio nguon: 0.9-0.96
```

### Model khong giong minh

Thu:

- Tang dataset sach len 30-60 phut.
- Doc dung phong cach su dung thuc te.
- Dung index file dung model.
- Kiem tra co dang chon nham `.pth` hoac `.index` khong.

### Train xong khong thay file index

Trong mot so ban Applio, train model va train index la hai buoc rieng. Tim nut **Train index**, **Create index**, hoac **Feature index** trong tab Training.

### Convert fail trong KAI STUDIO

Neu convert trong Applio OK nhung trong KAI STUDIO fail, kha nang cao la `argTemplate` khong khop `Use via API`. Copy lai `client.predict(...)` tu dung tab convert dang dung.

---

## 11. Ghi chu phap ly va dao duc

Chi train giong cua chinh ban hoac nguoi da cho phep ro rang. Neu dung de dang len YouTube, TikTok, Facebook, hoac cac nen tang khac, hay tuan thu yeu cau cong bo noi dung AI/synthetic voice cua nen tang do.
