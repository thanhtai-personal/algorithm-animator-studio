import manifest from "../../../docs/video-references/math-sincos-v1.scene-manifest.json";

/**
 * Independently written teaching narration, NOT a transcription of the source MP4.
 * All cue timings are frame-based approximations from the source-analysis manifest.
 * User may edit every line before generating their own voice.
 */
const TEXT: Record<string,string> = {
  "beat-01":"Tỉ số lượng giác trong tam giác vuông mới là điểm khởi đầu. Bây giờ ta thử nhìn nó trên đường tròn.",
  "beat-02":"Ta dựng đường tròn bán kính một, rồi quay bán kính theo một góc bất kỳ.",
  "beat-03":"Hình chiếu nằm ngang chính là cô-sin. Chiều dài có dấu phụ thuộc hướng của bán kính.",
  "beat-04":"Còn hình chiếu thẳng đứng chính là sin. Hai tọa độ thay đổi khi góc quay thay đổi.",
  "beat-05":"Với góc một trăm hai mươi độ, sin vẫn dương nhưng cô-sin lại âm.",
  "beat-06":"Hai góc sáu mươi và một trăm hai mươi độ có cùng độ cao trên đường tròn.",
  "beat-07":"Đối xứng qua trục dọc làm thay đổi dấu hình chiếu ngang, chứ không thay đổi độ cao.",
  "beat-08":"Vì vậy sin một trăm hai mươi độ bằng sin sáu mươi độ, còn cô-sin có dấu âm.",
  "beat-09":"Theo định lý Py-ta-go, bình phương hai hình chiếu cộng lại bằng bình phương bán kính, tức bằng một.",
  "beat-10":"Khi một điểm chuyển động đều trên đường tròn, hình chiếu của nó biến thiên theo thời gian.",
  "beat-11":"Ghi lại hình chiếu tại từng thời điểm, ta nhận được một đường cong uốn lượn.",
  "beat-12":"Đường cong ấy chính là đồ thị hàm sin. Nó lặp lại theo một chu kỳ đều đặn.",
  "beat-13":"Để đo góc, ngoài độ chúng ta còn dùng ra-đi-an. Một vòng tròn tương ứng hai pi ra-đi-an.",
  "beat-14":"Sin và cô-sin đều tạo nên sóng tuần hoàn, nhưng lệch pha nhau một phần tư chu kỳ.",
  "beat-15":"Trong tam giác vuông, góc này và góc kia phụ nhau. Cô-sin của góc này chính là sin của góc phụ.",
  "beat-16":"Tang của một góc bằng sin chia cô-sin. Ta có thể biểu diễn nó bằng tiếp tuyến.",
  "beat-17":"Khi cô-sin gần bằng không, giá trị tang tăng rất nhanh. Tại chín mươi độ, nó không xác định.",
  "beat-18":"Các nhánh đồ thị tang bị ngắt tại những đường tiệm cận. Từ đây, ta quay lại chuyện dây cung.",
  "beat-19":"Từ rất lâu trước đó, người ta dùng nửa dây cung để giải những bài toán đo đạc thiên văn.",
  "beat-20":"Tên gọi của sin trải qua nhiều ngôn ngữ, từ thuật ngữ cổ đến tiếng La-tinh sinus.",
  "beat-21":"Ngày nay chỉ cần một ký hiệu sin ngắn gọn để nói về cùng một quan hệ hình học.",
  "beat-22":"Một âm thoa rung cũng tạo nên dao động. Hình dạng của sóng giúp ta hiểu cách âm thanh lan truyền.",
  "beat-23":"Tần số và biên độ thay đổi làm âm thanh nghe cao, thấp, mạnh hoặc nhẹ khác nhau.",
  "beat-24":"Từ hình học, những quy luật tuần hoàn còn xuất hiện khắp thế giới tự nhiên.",
  "beat-25":"Nhìn bóng nắng, ta có thể sử dụng góc chiếu của Mặt Trời để suy ra kích thước và vị trí.",
  "beat-26":"Trục Trái Đất nghiêng làm góc chiếu sáng khác nhau theo mùa và theo vĩ độ.",
  "beat-27":"Mực nước và thủy triều cũng biến đổi theo nhịp tuần hoàn, có thể biểu diễn bằng đường cong.",
  "beat-28":"Biết khoảng cách tới gốc cây và góc ngẩng lên ngọn cây, ta tính được chiều cao qua hàm tang.",
  "beat-29":"Độ dốc của một đoạn đường rất quan trọng. Một đường dốc đủ thoải giúp xe lăn di chuyển an toàn hơn.",
  "beat-30":"Độ dốc phần trăm là độ cao tăng được trên một trăm đơn vị chiều ngang. Nó khác số đo độ của góc.",
  "beat-31":"Trong điện ba pha, ba tín hiệu hình sin lệch nhau một trăm hai mươi độ, tạo thành hệ thống cân bằng.",
  "beat-32":"Từ các vectơ pha, ta thấy mối liên hệ giữa điện áp pha và điện áp dây qua căn bậc hai của ba.",
  "beat-33":"Trước khi kết thúc, hãy trở lại câu hỏi lượng giác ban đầu, nhưng lần này dùng cả đường tròn.",
  "beat-34":"Góc phần tư xác định dấu của mỗi tọa độ. Chỉ một thay đổi về góc đã làm hình chiếu khác đi.",
  "beat-35":"Vậy sin một trăm hai mươi độ bằng căn ba chia hai, xấp xỉ không phẩy tám sáu sáu.",
  "beat-36":"Một câu hỏi nhỏ có thể mở ra rất nhiều ứng dụng lớn của toán học."
};

export type MathNarrationCue = {
  id:string; chapterId:string; title:string; startFrame:number; endFrame:number;
  draftText:string; /** Source cue boundaries are estimates, not verified word timestamps. */
  timingVerified:false;
};
export const MATH_NARRATION_CUES: readonly MathNarrationCue[] = [
  {
    id:"intro-00",chapterId:"intro",title:"Giới thiệu sin/cos",startFrame:0,endFrame:1000,
    draftText:"Sin và cô-sin tưởng như chỉ dành cho tam giác vuông. Nhưng chuyện gì xảy ra nếu góc lớn hơn chín mươi độ?",
    timingVerified:false,
  },
  ...manifest.referenceBeats.map(beat=>({
    id:beat.id, chapterId:beat.chapterId,title:beat.title,
    startFrame:beat.startFrame,endFrame:beat.endFrame,
    draftText:TEXT[beat.id]??"",timingVerified:false as const,
  })),
];

/** Audio placement is absolute on the original 25fps 15,217-frame canvas. */
export const mathNarrationCueById = new Map(MATH_NARRATION_CUES.map(c=>[c.id,c]));
export function voiceDurationSeconds(cue:MathNarrationCue){return (cue.endFrame-cue.startFrame)/25;}
