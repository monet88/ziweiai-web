// AUTO-GENERATED from scripts/translate/data/tarot-cards.vi.json. Do not edit by hand.
// 78 cards, verified 0 Han characters.
export interface TarotCategoryDetail {
  upright: string;
  reversed: string;
}

export interface TarotCardData {
  id: string;
  numericId: number;
  name: string;
  nameEn: string;
  type: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  number?: number;
  meaning: {
    upright: string;
    reversed: string;
  };
  description: string;
  interpretation: {
    upright: string;
    reversed: string;
  };
  advice: {
    upright: string;
    reversed: string;
  };
  categories: {
    love: TarotCategoryDetail;
    career: TarotCategoryDetail;
    wealth: TarotCategoryDetail;
    health: TarotCategoryDetail;
  };
}

export const TAROT_DATA: TarotCardData[] = [
  {
    "id": "major_00",
    "numericId": 0,
    "name": "Kẻ Khờ (The Fool)",
    "nameEn": "The Fool",
    "type": "major",
    "meaning": {
      "upright": "Khởi đầu mới, ngây thơ trong sáng, tự do, dấn thân vào điều chưa biết, tinh thần nguyên sơ",
      "reversed": "Bước đi liều lĩnh, trốn tránh trách nhiệm, tiến tới hấp tấp, sợ hãi việc lên đường"
    },
    "description": "Kẻ Khờ đứng bên vách đá, chú chó trắng bên cạnh, sau lưng là hành trang nhẹ tênh — hiện thân của linh hồn trước khi bị thế gian uốn nắn. Là con số không của Ẩn Chính, chàng vừa là điểm kết vừa là khởi nguyên: lòng can đảm dám tin trọn vẹn và bước vào hành trình đời người.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Kẻ Khờ cho thấy bạn đang đứng trước ngưỡng cửa của một hành trình mới. Bạn không cần có sẵn mọi kế hoạch — chỉ cần một trái tim rộng mở, không phòng bị. Chú chó trắng nhắc rằng ngây thơ không phải là dại khờ; trực giác không bị nỗi sợ nhuốm màu vẫn luôn bước đi bên bạn.",
      "reversed": "Ở chiều ngược, Kẻ Khờ không đơn thuần phủ nhận khởi đầu mới — lá bài cảnh báo rằng bước chân và ý định đang lệch nhau. Bạn có thể lao tới như thể ngã khỏi vách đá, hoặc đứng chôn chân trong khi cuộc đời đòi bạn phải nhúc nhích. Hãy tự hỏi cho rõ: bạn ra đi vì tự do, hay đang chạy trốn để rồi lang bạt?"
    },
    "advice": {
      "upright": "Hãy tin vào bản năng và bước bước đầu tiên. Đi nhẹ hành trang, và coi điều chưa biết là lời mời gọi chứ không phải mối đe dọa.",
      "reversed": "Hãy tìm nền đất vững dưới chân trước khi nói về những con đường xa. Nếu chưa thể nhúc nhích, hãy bắt đầu bằng bước nhỏ nhất có thể."
    },
    "categories": {
      "love": {
        "upright": "Một mối tình mới đến như cơn gió ấm đầu xuân. Đừng định sẵn cái kết — hãy gặp nhau bằng sự chân thành.",
        "reversed": "Có thể ai đó đang né tránh cam kết, hoặc lao vào theo bốc đồng mà chưa hiểu mình thật sự muốn gì."
      },
      "career": {
        "upright": "Chuyển nghề, khởi nghiệp và bước sang lĩnh vực mới đều đầy hứa hẹn. Người dám thử thường là người dẫn đường.",
        "reversed": "Đừng đổi việc bốc đồng hay khởi sự khi chưa có kế hoạch. Nếu thấy bế tắc, hãy tự hỏi bạn sợ thất bại hay sợ thay đổi."
      },
      "wealth": {
        "upright": "Những thử nghiệm nhỏ có thể mở ra nguồn thu mới, nhưng đừng đặt cược tất cả vào một canh bạc.",
        "reversed": "Chi tiêu bốc đồng hoặc đầu cơ có thể phản tác dụng. Hãy làm rõ dòng tiền vào ra trước khi mở rộng."
      },
      "health": {
        "upright": "Thân và tâm đều nhẹ nhõm. Hoạt động ngoài trời và thói quen chăm sóc mới rất hợp với bạn, tuy bên vách đá vẫn cần sự cẩn trọng.",
        "reversed": "Nếp sinh hoạt thất thường hoặc triệu chứng bị bỏ qua cần được chú ý. Thức trắng liều lĩnh và ăn kiêng cực đoan nên được tiết chế lại."
      }
    }
  },
  {
    "id": "major_01",
    "numericId": 1,
    "name": "Pháp Sư (The Magician)",
    "nameEn": "The Magician",
    "type": "major",
    "meaning": {
      "upright": "Ý chí, hiện thực hóa, bốn nguyên tố, tập trung, khởi sự",
      "reversed": "Tài năng chưa dùng tới, dối trá, ý chí phân tán, công cụ bị dùng sai"
    },
    "description": "Pháp Sư giơ một tay lên trời, một tay chạm đất. Gậy, cốc, kiếm và đồng tiền nằm trên bàn — quy luật \"trên sao dưới vậy\". Chàng là nguyên mẫu biến cảm hứng thành hành động, là sức mạnh của ý chí tập trung và nguồn lực được quy tụ.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Pháp Sư cho thấy bạn đã nắm trong tay những gì mình cần: kỹ năng, nguồn lực và thời điểm. Một ý định rõ ràng có thể kết nối tất cả lại. Khi bốn nguyên tố đã đủ đầy, trời, đất và nỗ lực con người gặp nhau nơi bạn. Thời khắc này đòi hành động, chứ không phải chờ đợi.",
      "reversed": "Ở chiều ngược, cây gậy có thể đang chỉ về ảo ảnh — tài năng bị đặt sai chỗ, lời hứa vượt quá năng lực, hoặc lời nói ngọt ngào che lấp sự chuẩn bị sơ sài. Ý chí có thể phân tán khắp quá nhiều hướng, và năng lực hiện thực hóa cứ thế cạn dần."
    },
    "advice": {
      "upright": "Hãy dồn sức vào một việc và biến ý tưởng thành bước đi đầu tiên hữu hình. Bạn đã có đủ thứ để biến nó thành hiện thực.",
      "reversed": "Hãy rèn kỹ năng trước khi trình diễn. Tránh phóng đại. Nếu thấy phân tán, hãy cắt bớt một nửa mục tiêu và giữ lại điều quan trọng nhất."
    },
    "categories": {
      "love": {
        "upright": "Hãy chủ động, sắp đặt buổi hẹn chu đáo — chân thành và sáng tạo có thể sưởi ấm mối quan hệ.",
        "reversed": "Lời ngon tiếng ngọt không bền, hoặc một bên kiểm soát quá nhiều. Hãy xem hành động có khớp với lời nói không."
      },
      "career": {
        "upright": "Một cánh cửa mở ra cho đề xuất, đàm phán và thể hiện tài năng. Hãy bước lên sân khấu khi nó còn thuộc về bạn.",
        "reversed": "Sơ yếu lý lịch phóng đại, dự án thổi phồng hoặc xung đột nội bộ có thể làm tổn hại vị thế nghề nghiệp của bạn."
      },
      "wealth": {
        "upright": "Kỹ năng và lợi thế thông tin có thể sinh lời. Việc làm thêm, tư vấn và sáng tạo nội dung đều có đất diễn.",
        "reversed": "Những lời chào mời lợi nhuận cao có thể ẩn chứa bẫy. Hãy kiểm chứng người và giấy tờ trước khi ký."
      },
      "health": {
        "upright": "Kỷ luật và kế hoạch tập luyện dễ duy trì hơn. Thân và tâm phối hợp nhịp nhàng; phương pháp luyện tập mới có thể hợp với bạn.",
        "reversed": "Quá dựa vào thực phẩm bổ sung hoặc mẹo dân gian mà bỏ qua nghỉ ngơi cơ bản là đặt xe trước ngựa."
      }
    }
  },
  {
    "id": "major_02",
    "numericId": 2,
    "name": "Nữ Tư Tế (The High Priestess)",
    "nameEn": "The High Priestess",
    "type": "major",
    "meaning": {
      "upright": "Trực giác, tiềm thức, tuệ giác thinh lặng, huyền bí thuộc về mặt trăng",
      "reversed": "Trực giác bị chặn, bí mật rò rỉ, tiếng ồn bề mặt át đi tiếng nói bên trong"
    },
    "description": "Nữ Tư Tế ngồi giữa hai cột đen trắng, cuộn giấy nửa kín nửa hở trên đùi, sau lưng là tấm màn che giữa chân lý ẩn và chân lý hiện. Nàng không tìm kiếm ra bên ngoài mà canh giữ lời sấm bên trong — tiềm thức, giấc mơ và chân lý chưa được thốt ra.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Nữ Tư Tế mời bạn tạm dừng tiếng ồn bên ngoài và lắng nghe vào trong. Cuộn giấy nửa kín không đòi bạn đọc ngay — nó nói rằng vài câu trả lời chưa chín, phải trồi lên qua thinh lặng và giấc mơ.",
      "reversed": "Ở chiều ngược, tấm màn bị xé toạc — bí mật tràn ra, trực giác bị lý trí hay chuyện trò xã hội nhấn chìm, hoặc bạn bịt miệng tiếng nói bên trong để làm hài lòng người khác. Bạn cũng có thể nhầm tưởng tượng thành sự thật. Hãy tìm lại thế cân bằng giữa tĩnh lặng và hành động."
    },
    "advice": {
      "upright": "Nói ít hơn và quan sát nhiều hơn. Ghi lại giấc mơ và linh cảm. Những lựa chọn quan trọng có thể chờ đến khi tuệ giác ẩn hiện ra.",
      "reversed": "Hãy giảm tải thông tin. Đừng lấy tiêu chuẩn của người khác thay cho sự hiểu biết bên trong. Nếu hoài nghi che mờ, hãy tách sự thật khỏi nỗi sợ."
    },
    "categories": {
      "love": {
        "upright": "Sự thấu hiểu sâu dần mà không cần vội. Sự đồng hành lặng lẽ nuôi dưỡng mối quan hệ hơn những lời tuyên bố hoành tráng.",
        "reversed": "Bí mật hoặc nghi ngờ lớn dần. Một người nói một đằng nghĩ một nẻo — cần sự thành thật hoặc khoảng cách."
      },
      "career": {
        "upright": "Nghiên cứu, viết lách và lên kế hoạch hậu trường đang ủng hộ bạn. Chiều sâu lúc này thắng sự phô trương.",
        "reversed": "Chuyện phiếm công sở hoặc lời thổ lộ bị rò rỉ, hay sự chần chừ khiến bạn mất một cơ hội nội bộ."
      },
      "wealth": {
        "upright": "Giao dịch thường xuyên không hợp với bạn bằng việc nắm giữ bền bỉ và đầu tư dựa trên nghiên cứu.",
        "reversed": "Sự riêng tư tài chính có thể bị phơi bày, hoặc thị trường chạy theo tin đồn có thể khiến bạn mắc bẫy."
      },
      "health": {
        "upright": "Hãy chú ý nội tiết tố và giấc ngủ. Thiền và yoga giúp lập lại cân bằng.",
        "reversed": "Những tín hiệu nhỏ của cơ thể bị bỏ qua, hoặc lo âu làm gián đoạn giấc ngủ và chu kỳ."
      }
    }
  },
  {
    "id": "major_03",
    "numericId": 3,
    "name": "Nữ Hoàng (The Empress)",
    "nameEn": "The Empress",
    "type": "major",
    "meaning": {
      "upright": "Sung túc, thiên chức mẹ, sự dưỡng dục tự nhiên, vẻ đẹp gợi cảm",
      "reversed": "Bảo bọc quá mức, khô cạn sáng tạo, phụ thuộc vào dưỡng chất từ bên ngoài"
    },
    "description": "Nữ Hoàng ngự giữa đồng lúa và rừng cây, biểu tượng sao Kim sáng rực trên đầu. Nàng là sự sung túc của đất mẹ và dưỡng chất cho các giác quan — sáng tạo, thai nghén và vẻ đẹp giúp sự sống lớn lên, nở hoa và kết trái.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Nữ Hoàng cho thấy sự sung túc đang chảy về phía bạn — không hẳn là giàu sang lớn, mà là sự lớn lên trong quan hệ, sáng tạo và nhận biết cơ thể. Hãy nuôi dưỡng bản thân bằng đất, nghệ thuật và cái đẹp trước khi nuôi người khác. Sự đủ đầy bắt đầu từ việc biết nhận.",
      "reversed": "Ở chiều ngược, nàng có thể bóp nghẹt bằng sự chăm sóc, kiểm soát dưới danh nghĩa yêu thương, hoặc cạn khô vì lâu ngày bỏ quên nhu cầu của chính mình. Đôi khi lá bài cho thấy sự phụ thuộc vào lời khen hay vật chất để lấp khoảng trống bên trong."
    },
    "advice": {
      "upright": "Hãy cho phép mình được đẹp và được thoải mái. Phục hồi bản thân trước khi nuôi dưỡng người khác và các dự án.",
      "reversed": "Hãy nới lỏng kiểm soát. Đừng mua sự thân mật bằng vật chất hay đòn bẩy cảm xúc. Nếu cảm hứng cạn, hãy trở về với thiên nhiên để nạp lại."
    },
    "categories": {
      "love": {
        "upright": "Sự ấm áp và chăm sóc chu đáo rất hợp cho chuyện hôn nhân hoặc đón một sinh linh mới.",
        "reversed": "Bám víu, kiểm soát, hoặc bị \"chăm sóc\" đến mức ngộp thở."
      },
      "career": {
        "upright": "Các lĩnh vực sáng tạo, thiết kế, giáo dục và gia đình có thể nở rộ. Không khí đội nhóm hài hòa.",
        "reversed": "Dự án đình trệ vì bị can thiệp quá nhiều, hoặc có người trong nhóm chỉ nhận mà không cho."
      },
      "wealth": {
        "upright": "Thu nhập từ công việc tăng đều. Những tài sản dài hạn gắn với chất lượng sống được ưu ái.",
        "reversed": "Chi tiêu vì hình thức, hoặc giao hết quyết định tài chính cho người khác."
      },
      "health": {
        "upright": "Sinh lực dồi dào. Hồi phục, hỗ trợ sinh sản và nghỉ ngơi dưỡng sức đều hợp với lá bài này.",
        "reversed": "Ăn quá độ hoặc kiêng khem cực đoan; vấn đề phụ khoa hay tiêu hóa có thể cần được chú ý."
      }
    }
  },
  {
    "id": "major_04",
    "numericId": 4,
    "name": "Hoàng Đế (The Emperor)",
    "nameEn": "The Emperor",
    "type": "major",
    "meaning": {
      "upright": "Quyền uy, kết cấu, trật tự, sự che chở của người cha",
      "reversed": "Bạo chúa, cứng nhắc, nhầm kiểm soát với chăm sóc"
    },
    "description": "Hoàng Đế ngồi trên ngai đá, tay cầm quyền trượng, giáp trên vai, dưới chân là núi non và con cừu đực. Chàng là trật tự trần thế, luật lệ và quyền uy người cha — kết cấu gìn giữ vương quốc, nhưng cũng có thể đánh mất lòng người vì lòng tự kiêu cố chấp.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Hoàng Đế cho thấy nhu cầu — hoặc sự nắm giữ — quyền lực để kiến tạo trật tự: đặt ra luật lệ, vạch ranh giới, đưa ra quyết định. Chàng là cây cột giữa cơn hỗn loạn. Thành công không chỉ nhờ cảm hứng mà nhờ kỷ luật, hệ thống và sự quản trị nguồn lực.",
      "reversed": "Ở chiều ngược, ngai vàng biến thành lồng giam: chuyên chế, cố chấp, kiểm soát để che lấp sự bất an, hoặc luật lệ trở nên áp bức. Lá bài cũng có thể cho thấy sự thiếu kỷ luật khi không ai cầm lái. Hãy cân chỉnh lại giữa quyền uy và linh hoạt."
    },
    "advice": {
      "upright": "Hãy đặt ra luật lệ rõ ràng và tuân thủ chúng trước tiên. Sự vững vàng và tinh thần trách nhiệm tạo dựng niềm tin.",
      "reversed": "Hãy lắng nghe gia đình hoặc đồng nghiệp. Luật lệ phải phục vụ con người, chứ không phải ngược lại."
    },
    "categories": {
      "love": {
        "upright": "Một người bạn đời chín chắn, vững vàng mang lại cảm giác an toàn. Tốt cho việc xây dựng tổ ấm và những dự định dài hơi.",
        "reversed": "Thái độ áp đặt hoặc sự kiểm soát lạnh lùng làm tổn hại mối quan hệ. Mệnh lệnh thay thế cho đối thoại."
      },
      "career": {
        "upright": "Thăng tiến, quản lý và xây dựng hệ thống đang ủng hộ bạn. Hãy thể hiện năng lực lãnh đạo và sự theo đuổi đến cùng.",
        "reversed": "Một người sếp quản lý vi mô, hoặc một đội nhóm không có phối hợp — hãy làm rõ ranh giới và vai trò."
      },
      "wealth": {
        "upright": "Tài chính thận trọng, bất động sản và hoạch định dài hạn bảo vệ nền tảng.",
        "reversed": "Canh bạc rủi ro một mình hoặc tranh chấp tiền bạc trong gia đình — hãy mời thêm góc nhìn thứ ba."
      },
      "health": {
        "upright": "Nhịp sinh hoạt đều đặn và tập luyện sức mạnh rất hữu ích. Hãy chú ý xương khớp và huyết áp.",
        "reversed": "Căng thẳng làm cứng cổ vai và rối loạn giấc ngủ. Đừng chỉ cắm cúi chịu đựng bằng công việc."
      }
    }
  },
  {
    "id": "major_05",
    "numericId": 5,
    "name": "Giáo Hoàng (The Hierophant)",
    "nameEn": "The Hierophant",
    "type": "major",
    "meaning": {
      "upright": "Truyền thống, dòng dõi, bậc thầy tâm linh, trật tự nghi lễ",
      "reversed": "Giáo điều, niềm tin tư nhân hóa, tìm chân lý bên ngoài thiết chế"
    },
    "description": "Giáo Hoàng ngồi giữa hai cột thiêng, ban lễ cho tín đồ, trao chìa khóa cho người học việc. Ngài là truyền thống đền đài, mạch nối thầy trò và đức tin hữu hình — người canh giữ giá trị tập thể và nghi thức.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Giáo Hoàng cho thấy một con đường qua truyền thống, người thầy và kinh điển — bạn không cần phải phát minh lại mọi thứ. Hôn lễ, nhập học và những bước gia nhập chính thức thường nằm dưới phúc lành của lá bài này.",
      "reversed": "Ở chiều ngược không chỉ là sự nổi loạn — đó là giáo lý tách rời khỏi linh hồn: hình thức rỗng tuếch, áp lực đạo đức, hoặc nhu cầu rời bỏ một nhóm không còn hợp để tìm đức tin ở nơi khác. Đôi khi bạn âm thầm chất vấn quyền uy trong khi niềm tin tái cấu trúc bên trong."
    },
    "advice": {
      "upright": "Hãy học từ người có kinh nghiệm. Tuân theo trình tự đúng đắn. Tuệ giác tập thể có thể đưa bạn đi một đoạn đường dài.",
      "reversed": "Nếu hệ thống phản bội trái tim bạn, hãy hỏi luật lệ ấy phục vụ ai. Đức tin có thể được dựng lại ngoài bức tường."
    },
    "categories": {
      "love": {
        "upright": "Sự chấp thuận của gia đình, kế hoạch hôn lễ, hoặc gặp gỡ qua những vòng tròn đáng tin — con đường truyền thống có thể hiệu quả.",
        "reversed": "Gia đình can thiệp hoặc áp lực kết hôn trái với cảm xúc thật."
      },
      "career": {
        "upright": "Thi cử, chứng chỉ, học nghề và những bước gia nhập có quy chuẩn được ưu ái.",
        "reversed": "Văn hóa công ty có thể bóp nghẹt đổi mới, hoặc bạn phải bước ra ngoài lề thói quen ngành."
      },
      "wealth": {
        "upright": "Ngân hàng, bảo hiểm và ủy thác nên được ưu tiên hơn những kênh xám.",
        "reversed": "Coi chừng những lời mách nước cổ phiếu từ các \"chuyên gia\" hoặc mô hình đa cấp. Hãy quay về lẽ thường."
      },
      "health": {
        "upright": "Hãy theo lời khuyên y khoa và khám định kỳ. Kết hợp chăm sóc truyền thống và hiện đại có thể hữu ích.",
        "reversed": "Điều trị theo cơn hoảng loạn, hoặc từ chối chăm sóc y tế mà chỉ tin vào mẹo dân gian."
      }
    }
  },
  {
    "id": "major_06",
    "numericId": 6,
    "name": "Người Yêu (The Lovers)",
    "nameEn": "The Lovers",
    "type": "major",
    "meaning": {
      "upright": "Lựa chọn, kết hợp, giá trị đồng điệu, giao ước trong khu vườn",
      "reversed": "Hài hòa bề ngoài, chia rẽ bên trong, cám dỗ, lựa chọn khó đảo ngược"
    },
    "description": "Trên lá Người Yêu, hai nhân vật đứng dưới thiên thần, sau lưng là hai gốc cây — lựa chọn lớn lao được đưa ra bằng ý chí tự do. Đây không chỉ là chuyện tình ái mà là phép thử xem linh hồn và hệ giá trị có đồng điệu hay không.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Người Yêu đánh dấu một lựa chọn về bản sắc và giá trị. Chọn A hay B không chỉ là được mất mà là bạn sẽ trở thành ai. Thiên thần làm chứng: chỉ khi trái tim và ý chí đồng thuận thì tình yêu và con đường mới bền.",
      "reversed": "Ở chiều ngược, khu vườn xao động: những mối quan hệ tay ba, hệ giá trị rạn vỡ, hoặc cám dỗ ngắn ngủi đi ngược lại bản ngã sâu thẳm. Bạn cũng có thể né tránh lựa chọn, giữ yên bề mặt trong khi trái tim dần xa cách."
    },
    "advice": {
      "upright": "Hãy đối diện trung thực với điều bạn coi trọng. Chọn con đường khớp với linh hồn mình — không phải với mọi khán giả.",
      "reversed": "Nếu mối quan hệ đã rỗng, hãy gặp nhau thẳng thắn. Khi cám dỗ đến, hãy hỏi: một năm nữa mình có hối hận vì điều này không?"
    },
    "categories": {
      "love": {
        "upright": "Năng lượng của người bạn đời tri kỷ. Tỏ tình, đính hôn hoặc sum họp từ cảm xúc chân thật được ưu ái.",
        "reversed": "Quan hệ tay ba, xung đột giá trị hoặc lòng trung thành bị chia cắt — hãy làm rõ ở lại hay ra đi."
      },
      "career": {
        "upright": "Quan hệ đối tác cần mục tiêu chung. Hãy chọn đội nhóm như chọn bạn đời.",
        "reversed": "Bán rẻ nguyên tắc vì đồng lương, hoặc đối tác có ý đồ ẩn có thể chia rẽ về sau."
      },
      "wealth": {
        "upright": "Liên doanh với đồng minh tin cậy có thể thành công nếu vai trò và quyền lợi được ghi rõ ràng.",
        "reversed": "Tiền bạc vướng mắc nghĩa vụ, hoặc lòng tham khiến chọn nhầm đối tác."
      },
      "health": {
        "upright": "Thân và tâm hòa hợp. Chuyện gần gũi và giao tiếp xã hội điều độ nâng cao tâm trạng.",
        "reversed": "Căng thẳng trong quan hệ có thể mang đến lo âu, mất ngủ hoặc giảm miễn dịch."
      }
    }
  },
  {
    "id": "major_07",
    "numericId": 7,
    "name": "Chiến Xa (The Chariot)",
    "nameEn": "The Chariot",
    "type": "major",
    "meaning": {
      "upright": "Ý chí chuyển động, thuần phục các thế lực đối nghịch, khải hoàn",
      "reversed": "Mất phương hướng, nội chiến bên trong, chiến thắng không bền"
    },
    "description": "Người đánh xe điều khiển hai tượng nhân sư không dùng dây cương, thành quách phía sau. Chàng hợp nhất những thế lực đối nghịch bằng ý chí — kẻ chiến thắng tiến lên qua xung đột, dù chiến thắng chỉ bền khi mục tiêu còn chính đáng.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Chiến Xa cho thấy đà tiến đủ mạnh để phá tan chướng ngại — mâu thuẫn, cạnh tranh, sức kéo trong ngoài đều có thể được điều phối. Khi cả hai con thú cùng kéo về một hướng, hãy tiến lên, nhưng nhớ vì sao mình chiến đấu.",
      "reversed": "Ở chiều ngược, cỗ xe lật nhào: phương hướng mất, cảm xúc và lý trí giao tranh, hoặc một chiến thắng rút kiệt thân tâm. Thành công bên ngoài mà trống rỗng bên trong — hãy ngừng vung roi và tự hỏi mình đang đi đâu."
    },
    "advice": {
      "upright": "Hãy khóa chặt mục tiêu và tiến bước có kỷ luật. Chiến thắng đã gần.",
      "reversed": "Hãy giải quyết xung đột bên trong trước khi tăng tốc. \"Đi đâu?\" quan trọng hơn \"Nhanh cỡ nào?\""
    },
    "categories": {
      "love": {
        "upright": "Hãy chủ động theo đuổi hoặc vượt qua khoảng cách và sự phản đối của gia đình — kiên trì có thể thành công.",
        "reversed": "Một người áp đảo còn một người thu mình, hoặc bạn thắng cuộc tranh luận mà mất đi mối quan hệ."
      },
      "career": {
        "upright": "Đấu thầu, thăng tiến và những đợt tăng tốc dự án đang ủng hộ sự táo bạo.",
        "reversed": "Chính trị công sở rút cạn bạn, hoặc mở rộng mù quáng khiến bạn không còn sức cho chặng sau."
      },
      "wealth": {
        "upright": "Chủ động tìm kiếm thị trường và đi lại vì khách hàng có thể nâng cao thu nhập.",
        "reversed": "Dùng đòn bẩy vì con số ngắn hạn, hoặc sai hướng — càng nỗ lực càng lún sâu vào thua lỗ."
      },
      "health": {
        "upright": "Hồi phục thể thao và phục hồi chức năng tiến triển tốt, nhưng tránh vận động quá sức.",
        "reversed": "Căng thẳng mạn tính chưa được giải quyết — hãy chú ý đau đầu và huyết áp."
      }
    }
  },
  {
    "id": "major_08",
    "numericId": 8,
    "name": "Sức Mạnh (Strength)",
    "nameEn": "Strength",
    "type": "major",
    "meaning": {
      "upright": "Sức mạnh dịu dàng, can đảm bên trong, tinh thần và bản năng cân bằng",
      "reversed": "Tự hoài nghi, dùng vũ lực, nỗi sợ quay vào trong"
    },
    "description": "Trên lá Sức Mạnh, một người phụ nữ nhẹ nhàng mở hàm sư tử, trên đầu là biểu tượng số tám nằm ngang. Sức mạnh ở đây không phải vũ lực mà là sự kiên nhẫn và hợp nhất — sự thuần phục điềm tĩnh của linh hồn trước bản năng.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Sức Mạnh cho thấy quyền lực thật sự không đè bẹp mà bao dung và bền bỉ. Bạn có thể trò chuyện với nỗi sợ, cơn giận và dục vọng thay vì hủy diệt chúng. Con sư tử được thuần hóa cho thấy tự nhiên và tinh thần có thể cùng tồn tại nhờ kiên nhẫn.",
      "reversed": "Ở chiều ngược, sư tử cắn trả: hoài nghi, mất kiểm soát, hoặc sự cứng rắn che giấu tổn thương. Sức mạnh có thể bắt nạt kẻ yếu, hoặc lời tự phê bình bên trong đóng băng hành động."
    },
    "advice": {
      "upright": "Hãy đối diện thử thách bằng sự dịu dàng kiên định. Kiên nhẫn và lòng tự thương là sức mạnh.",
      "reversed": "Đừng gây chiến với cảm xúc — hãy thừa nhận nỗi sợ, rồi bước tiếp. Nếu đã làm tổn thương ai, hãy sửa chữa trước khi nhận mình mạnh mẽ."
    },
    "categories": {
      "love": {
        "upright": "Kiên nhẫn và bao dung hóa giải xung đột. Đam mê có thể sâu dần thành tin cậy.",
        "reversed": "Thao túng cảm xúc hoặc trừng phạt lạnh lùng, hay nỗi xấu hổ chặn lối bày tỏ nhu cầu chân thật."
      },
      "career": {
        "upright": "Khách hàng khó tính và dự án phức tạp sẽ khuất phục trước sự chuyên nghiệp bền bỉ.",
        "reversed": "Xung đột với cấp trên hoặc tự phủ định khiến bạn không dám đòi điều mình xứng đáng."
      },
      "wealth": {
        "upright": "Nắm giữ dài hạn và đầu tư đều đặn hợp với lá bài này hơn là giao dịch điên cuồng.",
        "reversed": "Bán tháo vì hoảng loạn hoặc tâm thế cờ bạc — bị nỗi sợ hay lòng tham giật dây."
      },
      "health": {
        "upright": "Chăm sóc tâm lý, vận động nhẹ nhàng và liệu pháp nghệ thuật đều hữu ích.",
        "reversed": "Lo âu chưa được xử lý lưu lại trong cơ thể, hoặc tập luyện quá độ đến mức chấn thương."
      }
    }
  },
  {
    "id": "major_09",
    "numericId": 9,
    "name": "Ẩn Sĩ (The Hermit)",
    "nameEn": "The Hermit",
    "type": "major",
    "meaning": {
      "upright": "Tìm kiếm vào trong, ngọn đèn cô độc, tuệ giác lắng đọng",
      "reversed": "Thu mình quá sâu, từ chối sự dẫn dắt, lạc lối trong sương mù cô đơn"
    },
    "description": "Ẩn Sĩ leo dốc với ngọn đèn giơ cao, áo choàng xám quấn quanh, cách xa tiếng ồn thế tục. Ngài tìm chân lý bên trong, đánh đổi sự đồng hành lấy tuệ giác — ánh đèn chỉ soi bước kế tiếp, nhưng thế là đủ trên con đường tối.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Ẩn Sĩ đánh dấu mùa lui về, chiêm nghiệm và làm việc một mình. Câu trả lời không nằm trong đám đông mà trên con đường bạn leo cùng ngọn đèn. Hãy lùi khỏi cuộc đua; chiều sâu mua bằng sự chậm rãi vẫn là tiến bộ.",
      "reversed": "Ở chiều ngược, ngọn đèn tắt phụt: cô lập quá mức, từ chối lòng tốt, hoặc mất phương hướng trong khi \"đi tìm chính mình\". Bạn cũng có thể nấp sau vỏ bọc tâm linh để trốn tránh bổn phận vẫn đang chờ."
    },
    "advice": {
      "upright": "Hãy cho mình khoảng tĩnh lặng không bị ngắt quãng — đọc, đi bộ, viết. Ngọn đèn sẽ trả lời.",
      "reversed": "Nếu đã khép cửa quá lâu, hãy nhận lấy một người dẫn đường đáng tin. Cô độc nên là lựa chọn, không phải nhà tù."
    },
    "categories": {
      "love": {
        "upright": "Người độc thân có thể đào sâu bản thân trước khi gắn bó; người có đôi cần khoảng riêng và chiều sâu chân thật.",
        "reversed": "Khoảng cách lạnh lùng hoặc từ chối trò chuyện — tình yêu như bị một ngọn núi chắn ngang."
      },
      "career": {
        "upright": "Nghiên cứu, viết lách, học tập và công việc từ xa độc lập được ưu ái.",
        "reversed": "Lệch khỏi đội nhóm hoặc từ chối tiếp thu người dẫn dắt khiến bạn đánh mất cơ hội trưởng thành."
      },
      "wealth": {
        "upright": "Tài chính thận trọng và chi tiêu xã giao ít hơn — gìn giữ nhiều hơn là vươn tay nắm lấy.",
        "reversed": "Bỏ lỡ cơ hội vì cô lập, hoặc quan hệ đối tác bị cản trở bởi sự thu mình."
      },
      "health": {
        "upright": "Nghỉ ngơi yên tĩnh, thiền định, ngủ sớm — tốt cho việc phát hiện vấn đề mạn tính.",
        "reversed": "Trầm cảm khép kín dần — hãy tìm sự hỗ trợ chuyên môn hoặc người thân tin cậy."
      }
    }
  },
  {
    "id": "major_10",
    "numericId": 10,
    "name": "Bánh Xe Vận Mệnh (Wheel of Fortune)",
    "nameEn": "Wheel of Fortune",
    "type": "major",
    "meaning": {
      "upright": "Vòng tuần hoàn chuyển động, nhân quả, vận may đổi thay",
      "reversed": "Chống lại bánh xe, vận rủi mắc kẹt, nhìn thăng trầm mà không thấy quy luật"
    },
    "description": "Bánh Xe quay — tượng nhân sư ở trên, rắn và thần Anubis ở dưới, biểu tượng bốn phương chuyển động. Đó là sự tuần hoàn của vũ trụ: không ai ở mãi trên đỉnh, và cũng không ai nằm mãi dưới đáy.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Bánh Xe cho thấy sự thay đổi đang đến — vận may có thể lên, hoặc một biến chuyển cần thiết có thể tới. Khoảnh khắc này là một mắt xích trong chuỗi lớn hơn. Thuận theo vòng quay tốt hơn là chống cự cứng nhắc; sợi dây nhân quả thắt chặt dần.",
      "reversed": "Ở chiều ngược, bánh xe kẹt lại: chống lại thay đổi cần thiết, lặp lại sai lầm cũ, hoặc đổ lỗi cho số phận trong khi phớt lờ lựa chọn của mình. Đôi khi sự dừng lại chính là nạp lực trước vòng quay kế tiếp."
    },
    "advice": {
      "upright": "Hãy chấp nhận thay đổi. Tích lương khi mùa tốt; giữ cốt lõi khi mùa xuống. Vòng quay rồi sẽ đổi chiều.",
      "reversed": "Hãy hỏi xem khuôn mẫu nào đang lặp lại. Đổi một thói quen và bánh răng có thể lỏng ra."
    },
    "categories": {
      "love": {
        "upright": "Cảm giác như duyên phận — sum họp hoặc gặp gỡ mới có thể đến. Hãy thuận theo dòng chảy.",
        "reversed": "Chu kỳ hợp tan mà không rút ra bài học, hoặc đổ lỗi cho \"vận rủi\" vì những vấn đề lẽ ra tránh được."
      },
      "career": {
        "upright": "Ngành nghề xoay vần và vai trò thay đổi mang đến cơ hội. Hãy giữ sự thích nghi.",
        "reversed": "Chống lại thay đổi tổ chức, hoặc càng dấn sâu khi vận may đang chống lại bạn."
      },
      "wealth": {
        "upright": "Có thể xuất hiện món lời bất ngờ — hãy biết lúc nào nên rút lui.",
        "reversed": "Chuỗi thua bạc bị nuôi bằng việc đặt cược thêm, hoặc bắt đáy mù quáng."
      },
      "health": {
        "upright": "Thể trạng hoặc cơ địa bước sang giai đoạn mới — hãy làm việc theo nhịp điệu.",
        "reversed": "Triệu chứng cũ quay lại, hoặc chu kỳ cảm xúc cần được nhìn nhận trung thực."
      }
    }
  },
  {
    "id": "major_11",
    "numericId": 11,
    "name": "Công Lý (Justice)",
    "nameEn": "Justice",
    "type": "major",
    "meaning": {
      "upright": "Cán cân thăng bằng, nghiệp quả đến hồi, phán đoán lý trí",
      "reversed": "Thiên vị, né tránh, cán cân nghiêng lệch, tiêu chuẩn hai mặt"
    },
    "description": "Công Lý cầm gươm và cán cân, mắt mở, không bị lay chuyển. Lưỡi gươm cắt đứt giả dối; cán cân đo được mất — sự thăng bằng nghiệp quả, luật pháp và chân lý đạo đức hiện ra trước mắt.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Công Lý cho thấy hồi kết đang gần — bạn gặt điều mình đã gieo. Hợp đồng, tranh chấp và những lựa chọn đạo đức nghiêng về kết cục công bằng. Hãy đối diện sự thật bằng lý trí, không bằng cơn nóng.",
      "reversed": "Ở chiều ngược, cán cân nghiêng lệch: tự dối mình, tiêu chuẩn hai mặt, bổn phận bị né tránh, hoặc bất công bạn chưa thể sửa. Công lý cay nghiệt có thể gây thương tích — hãy phân biệt nguyên tắc với sự cố chấp."
    },
    "advice": {
      "upright": "Hãy hành xử trung thực và theo đúng trình tự. Hãy gánh phần của mình — cán cân sẽ tự chỉnh lại.",
      "reversed": "Hãy xét lại tiêu chuẩn hai mặt của chính bạn. Nếu bị xử bất công, hãy thu thập bằng chứng và tìm cách sửa sai thay vì chỉ giận dữ."
    },
    "categories": {
      "love": {
        "upright": "Mối quan hệ bước vào giai đoạn thẳng thắn — bàn chuyện hôn nhân nên nói rõ điều kiện và kỳ vọng.",
        "reversed": "Bí mật, phản bội hoặc cho nhận lệch lạc — niềm tin đã rạn nứt."
      },
      "career": {
        "upright": "Hợp đồng, đánh giá và khiếu nại đang ủng hộ lập luận rõ ràng.",
        "reversed": "Sự bất công nơi công sở hoặc rủi ro tuân thủ của chính bạn — hãy rà soát trước khi vận may cạn."
      },
      "wealth": {
        "upright": "Thuế, nợ nần và chia phần được xử lý hợp pháp, rõ ràng.",
        "reversed": "Sổ sách lộn xộn hoặc thu nhập xám có thể quay lại thành rắc rối."
      },
      "health": {
        "upright": "Chẩn đoán làm rõ vấn đề; hãy theo phác đồ để tiến về thế cân bằng.",
        "reversed": "Kết quả xét nghiệm bị bỏ qua, hoặc mất cân bằng kéo dài thành bệnh."
      }
    }
  },
  {
    "id": "major_12",
    "numericId": 12,
    "name": "Kẻ Treo Ngược (The Hanged Man)",
    "nameEn": "The Hanged Man",
    "type": "major",
    "meaning": {
      "upright": "Góc nhìn bị treo lại, hy sinh tự nguyện, tuệ giác đang chờ",
      "reversed": "Khổ đau vô nghĩa, trì hoãn đội lốt chờ đợi, hy sinh thành cực nhọc"
    },
    "description": "Kẻ Treo Ngược bị treo bằng một chân, thư thái, đầu thấp hơn chân, hào quang trên đầu. Chàng đánh đổi quyền kiểm soát để lấy góc nhìn mới — sự tạm dừng tự nguyện, buông bỏ và tuệ giác tìm được khi nhìn đời lộn ngược.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Kẻ Treo Ngược nói rằng dừng lại tốt hơn là tiến bước mù quáng. Vài chuyện cần được treo lại, nhượng bộ, hoặc lật ngược góc nhìn trước khi tuệ giác xuất hiện. Sự hy sinh của chàng là tự chọn, để hiểu điều vượt ngoài tầm kiểm soát.",
      "reversed": "Ở chiều ngược, việc treo mình thành hình phạt: trì hoãn, chịu đựng vô nghĩa, hoặc \"chờ đợi\" để né hành động. Người khác mệt mỏi vì tư thế ấy. Bạn cũng có thể đang bám chặt thứ lẽ ra nên buông."
    },
    "advice": {
      "upright": "Nếu đường bị chặn, hãy dừng lại và đổi góc nhìn. Đôi khi lùi một bước chính là tiến.",
      "reversed": "Hãy phân biệt chờ đợi có ý nghĩa với trì hoãn vì sợ. Khi đến lúc hành động, đừng tự hào vì mình đã chịu đựng."
    },
    "categories": {
      "love": {
        "upright": "Khoảng lặng hoặc sự tạm xa có thể làm rõ lòng nhau — kiên nhẫn có thể được đền đáp.",
        "reversed": "Cho đi một chiều trong mối quan hệ không hồi đáp — hãy đặt ra giới hạn."
      },
      "career": {
        "upright": "Dự án bị hoãn hoặc chờ luân chuyển rất hợp để chiêm nghiệm và hồi sức.",
        "reversed": "Sợ ra quyết định kéo dài sự trì hoãn, hoặc việc bận rộn mà không mang lại trưởng thành."
      },
      "wealth": {
        "upright": "Tiền tạm bị phong tỏa — hãy giữ dòng tiền, tránh mở rộng khiên cưỡng.",
        "reversed": "Giữ một khoản đầu tư thua lỗ vì sĩ diện, hoặc bỏ lỡ thời điểm cắt lỗ."
      },
      "health": {
        "upright": "Nghỉ ngơi, liệu pháp đảo ngược tư thế, hoặc những bài tập \"lộn ngược\" nhẹ nhàng có thể hữu ích.",
        "reversed": "Chạy khắp nơi tìm thầy chữa bệnh mạn tính, hoặc hồi phục thụ động kéo dài lê thê."
      }
    }
  },
  {
    "id": "major_13",
    "numericId": 13,
    "name": "Chuyển Hóa (Death)",
    "nameEn": "Death",
    "type": "major",
    "meaning": {
      "upright": "Kết thúc mang tính chuyển hóa, lột bỏ vỏ cũ, cổng tái sinh",
      "reversed": "Kết thúc giả tạo, sợ lột xác, bám chặt đống đổ nát"
    },
    "description": "Chuyển Hóa cưỡi ngựa trắng, cờ có đóa hồng huyền bí — trước mặt là vua, trẻ nhỏ và giám mục. Không chỉ là cái chết thân xác mà là sứ giả của kết thúc lớn lao và tái sinh: con người cũ phải chết đi để cái mới được sống.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Chuyển Hóa cho thấy một chương phải khép lại — công việc, tình yêu, niềm tin hay thói quen kết thúc trọn vẹn trước khi không gian mới mở ra. Đóa hồng trên cờ nói rằng sự hủy diệt chứa mầm tái sinh. Hãy ôm lấy thay đổi để bớt đau hơn là chống cự.",
      "reversed": "Ở chiều ngược, sự chuyển hóa bị đình trệ: những mối quan hệ nửa sống nửa chết, công việc bị nán lại trong căm ghét, tuyên bố đổi thay mà hành xử vẫn như cũ. Nỗi sợ giữ lại chiếc vỏ đang mục ruỗng. Kết thúc không đồng nghĩa với thất bại."
    },
    "advice": {
      "upright": "Hãy để điều phải qua đi được ra đi trong phẩm giá — dọn dẹp, từ bỏ, nghi lễ tạm biệt — và tạo chỗ trống.",
      "reversed": "Nếu trái tim đã rời đi từ lâu, hãy thừa nhận và hành động. Kéo dài chỉ làm mọi người đau."
    },
    "categories": {
      "love": {
        "upright": "Chia tay, ly hôn hoặc đặt lại toàn bộ khuôn mẫu — sau kết thúc, đời mới có thể đến.",
        "reversed": "Giữ lại một hình thức trống rỗng, hoặc tái hợp mà không chữa lành vết thương cũ."
      },
      "career": {
        "upright": "Rời đi, chuyển ngành hoặc đóng một mảng là chuyển tiếp — không phải hủy diệt.",
        "reversed": "Căm ghét vai trò nhưng sợ ra đi, hoặc bị sa thải mà không có phương án dự phòng."
      },
      "wealth": {
        "upright": "Xóa nợ xấu, hoán đổi tài sản — đóng một canh bạc thua là đang cắt lỗ.",
        "reversed": "Bẫy chi phí chìm — ném tiền tốt theo tiền xấu, không chịu thoát ra."
      },
      "health": {
        "upright": "Phẫu thuật, cai nghiện, chấm dứt phác đồ cũ — giai đoạn hồi phục chính là đời mới.",
        "reversed": "Né tránh chẩn đoán, hoặc thói quen cũ khiến mọi lần cố cai đều đổ vỡ."
      }
    }
  },
  {
    "id": "major_14",
    "numericId": 14,
    "name": "Tiết Độ (Temperance)",
    "nameEn": "Temperance",
    "type": "major",
    "meaning": {
      "upright": "Pha trộn của thiên thần, dòng chảy chừng mực, hợp nhất thuật giả kim",
      "reversed": "Cực đoan, pha trộn vội vàng, hài hòa chỉ ở bề mặt"
    },
    "description": "Tiết Độ đứng một chân trong nước, một chân trên đất, hai chiếc cốc rót qua lại theo vòng tuần hoàn — sự hòa trộn thuật giả kim giữa những mặt đối lập nhờ kiên nhẫn và mục đích. Không vội vàng cũng không đình trệ; cân bằng chính là nghệ thuật.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Tiết Độ kêu gọi sự hòa trộn — công việc và đời sống, lý trí và cảm xúc, nhanh và chậm tìm được tỷ lệ vàng. Thiên thần rót liên tục chứ không đổ một lần: chừng mực là thế cân bằng khó nhọc, không phải sự tầm thường.",
      "reversed": "Ở chiều ngược, dòng chảy tràn ra: thái quá, kiêng khem khắc nghiệt, cảm xúc thất thường, hoặc yên ổn bên ngoài mà rạn nứt bên trong. Vội vàng tạo ra vàng sẽ thất bại — hãy trở về với nhịp độ và lòng kiên nhẫn."
    },
    "advice": {
      "upright": "Hãy tiến từng bước. Mỗi ngày chỉnh một điều. Hợp nhất tốt hơn giao chiến.",
      "reversed": "Hãy gọi tên một thói quen cực đoan. Thay đổi một điểm cân bằng nhỏ — đừng đòi tái sinh qua một đêm."
    },
    "categories": {
      "love": {
        "upright": "Những người bạn đời bù trừ cho nhau sẽ hòa hợp dần; trò chuyện dịu dàng chữa lành tổn thương cũ.",
        "reversed": "Nghiện ngập hoặc cảm xúc cực đoan, hay sự \"hài hòa\" che giấu những nút thắt chưa gỡ."
      },
      "career": {
        "upright": "Làm việc liên nhóm và nhượng bộ sẽ thành công theo thời gian.",
        "reversed": "Tăng ca nghiền nát hoặc buông xuôi vô cảm — nhịp điệu đội nhóm đổ vỡ."
      },
      "wealth": {
        "upright": "Phân bổ đa dạng và đóng góp đều đặn đưa bạn tới thế cân bằng.",
        "reversed": "Chi tiêu trả đũa hoặc hoảng loạn hà tiện — nhịp tiền bạc bị lệch."
      },
      "health": {
        "upright": "Ăn uống và vận động điều độ; chăm sóc kết hợp và phục hồi đều đặn rất hữu ích.",
        "reversed": "Chu kỳ ăn cuồng rồi nhịn đói, hoặc thuốc không được uống đúng chỉ định."
      }
    }
  },
  {
    "id": "major_15",
    "numericId": 15,
    "name": "Quỷ Dữ (The Devil)",
    "nameEn": "The Devil",
    "type": "major",
    "meaning": {
      "upright": "Xiềng xích của dục vọng, trói buộc vật chất, đối diện bóng tối",
      "reversed": "Xiềng xích lỏng dần, nhìn thấy cám dỗ, ảo ảnh tan vỡ"
    },
    "description": "Trên lá Quỷ Dữ, hai nhân vật mang xiềng xích lỏng lẻo mà không ai tháo ra. Hình tượng có sừng ngồi trên ngai, ngọn đuốc lộn ngược. Sự trói buộc thường là tự nguyện — nghiện ngập, ám ảnh, nỗi sợ được khoác áo \"tôi không còn lựa chọn nào\".",
    "interpretation": {
      "upright": "Ở chiều xuôi, Quỷ Dữ cho thấy sự giam hãm tự nguyện — nghiện ngập, mối quan hệ độc hại, lòng tham, khát khao quyền lực. Những mắt xích lỏng lẻo vậy mà không ai rời đi. Hãy đối diện bóng tối: điều bạn thật sự sợ mất là gì? Gọi được tên nó là bắt đầu giải phóng.",
      "reversed": "Ở chiều ngược, xiềng xích rơi xuống — thức tỉnh, cai nghiện, rời bỏ thứ độc hại, nhìn ra sự thao túng. Cám dỗ vẫn có thể kéo lại, nhưng sự thật đã được nhìn thấy; thói quen cũ có thể trỗi dậy nếu thiếu cảnh giác."
    },
    "advice": {
      "upright": "Hãy liệt kê những gì bạn \"không thể rời bỏ\" và hỏi: ai đã khóa nó lại — người khác hay chính bạn?",
      "reversed": "Hãy dùng khoảng sáng rõ này để cắt đứt các tác nhân gây nghiện và dựng lên chỗ dựa phòng tái nghiện."
    },
    "categories": {
      "love": {
        "upright": "Đam mê biến thành sở hữu, kiểm soát hoặc quan hệ tay ba — hãy phân biệt tình yêu với cơn đói.",
        "reversed": "Rời bỏ độc hại, hoặc nhận ra người kia không phải lựa chọn duy nhất của bạn."
      },
      "career": {
        "upright": "Còng vàng, công việc xám, hoặc sự ép buộc tinh thần nơi làm việc — hãy đọc hợp đồng thật kỹ.",
        "reversed": "Thoát khỏi bóc lột, hoặc từ chối những khoản lợi bất chính."
      },
      "wealth": {
        "upright": "Cờ bạc, chi tiêu quá đà, mô hình đa cấp — dục vọng dắt mũi bạn.",
        "reversed": "Tái cơ cấu nợ, bỏ cá cược và vay nóng — tự do tài chính quay trở lại."
      },
      "health": {
        "upright": "Nghiện ngập và thái quá hại thân hại tâm — có thể cần đến sự giúp đỡ chuyên môn.",
        "reversed": "Việc cai nghiện cần có người đồng hành; quá trình hồi phục đã bắt đầu."
      }
    }
  },
  {
    "id": "major_16",
    "numericId": 16,
    "name": "Tòa Tháp (The Tower)",
    "nameEn": "The Tower",
    "type": "major",
    "meaning": {
      "upright": "Sét đánh, niềm tin cũ sụp đổ, khải thị đột ngột",
      "reversed": "Rạn nứt bên trong, sụp đổ bị trì hoãn, từ chối tỉnh thức"
    },
    "description": "Tòa Tháp bị sét đánh; vương miện rơi xuống; những hình người lao xuống. Khải thị đột ngột — cấu trúc giả tạo sụp đổ trong chớp mắt. Cú sốc quét sạch ảo ảnh xây bằng cát và dọn chỗ cho sự thật.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Tòa Tháp cho thấy một đổ vỡ đang ở đây hoặc đang tới — lời dối bị phơi bày, dự án thất bại, mối quan hệ tan vỡ như sét đánh. Chiếc vương miện rơi xuống là quyền uy đã chết. Sau đau đớn là nhẹ nhõm: bạn đang đứng trên nền đất thật để dựng lại.",
      "reversed": "Ở chiều ngược, tòa tháp nứt nhưng chưa đổ — phủ nhận, chắp vá tạm bợ, hoặc vụ nổ bị trì hoãn. Địa chấn bên trong — niềm tin vỡ tan trong khi gương mặt vẫn bình thản — hãy để nó sụp đổ trước khi dựng lại."
    },
    "advice": {
      "upright": "Hãy chấp nhận cú ngã. Rời khỏi kết cấu không an toàn. Dựng lại trung thực trên đống đổ nát — không phải bằng nỗi nhớ đỉnh cao xưa.",
      "reversed": "Hãy kiểm tra điểm yếu trước cú đánh lớn. Sau cú sốc, đừng giả vờ rằng chẳng có gì vỡ."
    },
    "categories": {
      "love": {
        "upright": "Sự thật bị che giấu bùng nổ, trận cãi dữ dội, hoặc chia ly đột ngột — sau cú sốc, hãy nhìn cho rõ.",
        "reversed": "Vấn đề chất đống không nói ra, hoặc vướng mắc lằng nhằng sau khi chia tay."
      },
      "career": {
        "upright": "Sa thải, dự án đổ vỡ, chính sách chấn động — hãy tìm chỗ đứng mới.",
        "reversed": "Rủi ro bị phớt lờ đến khi tổn thất lớn hơn; chống lại thay đổi tốn kém hơn."
      },
      "wealth": {
        "upright": "Khoản đầu tư nổ tung hoặc gian lận bị phanh phui — hãy bảo vệ những gì còn lại.",
        "reversed": "Vẫn đang giữ rủi ro nặng, hoặc rò rỉ nhỏ bị bỏ qua đến khi thành lũ."
      },
      "health": {
        "upright": "Triệu chứng đột ngột là tín hiệu báo động — hãy tìm chăm sóc y tế ngay.",
        "reversed": "Vấn đề mạn tính không được điều trị, hoặc căng thẳng kích nổ thành cơn cấp."
      }
    }
  },
  {
    "id": "major_17",
    "numericId": 17,
    "name": "Ngôi Sao (The Star)",
    "nameEn": "The Star",
    "type": "major",
    "meaning": {
      "upright": "Hy vọng được rót đầy, suối nguồn chữa lành, ngôi sao dẫn lối",
      "reversed": "Đức tin lung lay, chân trời mờ mịt, chậm chạp uống lấy"
    },
    "description": "Dưới tám ngôi sao, một hình người quỳ bên hồ, một chân trong nước, một chân trên bờ, rót nước từ hai chiếc bình. Ngôi Sao là hy vọng sau tổn thương — đức tin, cảm hứng, sự trở về chậm rãi với mục đích cao cả hơn.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Ngôi Sao nói rằng màn đêm đang mỏng dần — sau Tòa Tháp, hy vọng dịu êm trở lại. Nó hứa hẹn phương hướng, không phải thắng lợi tức thì. Như nước chạm cổ họng, việc chữa lành cần thời gian, nhưng ánh sáng là thật.",
      "reversed": "Ở chiều ngược, những chiếc bình treo rỗng: lạc quan rỗng tuếch, mục tiêu mờ nhạt, sáng tạo bị chặn, hoặc không tin mình xứng đáng với điều tốt. Bạn có thể biết mình cần nước mà vẫn không chịu uống — hãy biến hy vọng thành một hành động mỗi ngày."
    },
    "advice": {
      "upright": "Hãy giữ đức tin. Làm những điều tốt nhỏ mà chắc. Những ngôi sao sẽ dẫn lối.",
      "reversed": "Nếu tuyệt vọng quá sâu, hãy tìm sự giúp đỡ chuyên môn hoặc cộng đồng. Chia tầm nhìn thành một việc bạn có thể làm hôm nay."
    },
    "categories": {
      "love": {
        "upright": "Sau tổn thương cũ, mối gắn bó mới hoặc sự hàn gắn dịu dàng có thể đến.",
        "reversed": "Thất vọng trong tình yêu, sợ tin tưởng, hoặc hình mẫu bạn đời tách rời khỏi đời thực."
      },
      "career": {
        "upright": "Công việc dài hơi thấy ánh bình minh; lĩnh vực sáng tạo, thiện nguyện, nghệ thuật khởi sắc.",
        "reversed": "Mục tiêu trôi dạt, đổi hướng quá thường xuyên, hoặc kiệt sức trước khi kịp hồi phục."
      },
      "wealth": {
        "upright": "Hồi phục chậm — đầu tư dài hạn tốt hơn tiền nhanh.",
        "reversed": "Kế hoạch tài chính trống rỗng, hoặc chi tiêu trước khi tiền tái thiết về tới."
      },
      "health": {
        "upright": "Hồi phục, chữa lành tâm lý, nghỉ dưỡng — tất cả đều được ưu ái.",
        "reversed": "Sức khỏe tinh thần bị bỏ bê, hoặc ngừng điều trị quá sớm."
      }
    }
  },
  {
    "id": "major_18",
    "numericId": 18,
    "name": "Mặt Trăng (The Moon)",
    "nameEn": "The Moon",
    "type": "major",
    "meaning": {
      "upright": "Thủy triều tiềm thức, lối đi đánh lừa, bất định dưới ánh trăng",
      "reversed": "Sương tan, nỗi sợ được gọi tên, ảo ảnh rút đi"
    },
    "description": "Dưới Mặt Trăng, chó và sói cùng hú, con tôm bò lên khỏi hồ, con đường uốn về phía những ngọn đồi xa. Ảo ảnh, nỗi sợ và tầng sâu tâm trí — điều bạn thấy có thể không phải điều đang là. Vậy mà con đường vẫn đòi bạn bước tiếp trong hoài nghi.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Mặt Trăng đặt bạn vào màn sương — trực giác và huyễn tưởng quyện vào nhau, ký ức cũ và giấc mơ trồi lên. Bạn không cần thấy toàn bộ bản đồ; hãy đánh dấu lối đi, bước chậm, đừng nhầm bóng đen thành thú dữ cũng đừng nhầm thú dữ thành bóng đen.",
      "reversed": "Ở chiều ngược, một đường sáng rõ mở ra — sự thật hiện lên, nỗi sợ được gọi tên thì co lại, ảo tưởng phai dần. Bạn vẫn có thể núp trong huyền bí để trốn ánh sáng ban ngày; khi sương tan, sự thật trần trụi phải được đối diện."
    },
    "advice": {
      "upright": "Hãy ghi lại giấc mơ và những bất an. Trì hoãn lựa chọn lớn đến khi rõ ràng hơn. Có bạn đồng hành tốt hơn đi đêm một mình.",
      "reversed": "Hãy viết ra nỗi sợ lớn nhất và kiểm chứng nó — thường nó nhỏ hơn tưởng tượng. Nếu ban ngày đã sáng, hãy hành động dưới ánh sáng ban ngày."
    },
    "categories": {
      "love": {
        "upright": "Sự mập mờ, nghi ngờ, hoặc bóng tối cũ trong tình yêu — đã đến lúc nhìn cho rõ.",
        "reversed": "Hiểu lầm được hóa giải, hoặc ảo tưởng về người kia tan biến."
      },
      "career": {
        "upright": "Thông tin chưa đầy đủ, dòng ngầm nơi công sở — hãy kiểm chứng trước khi tin vào tin đồn.",
        "reversed": "Chuyện bên trong được hé lộ, hoặc bổn phận cuối cùng cũng rõ ra khỏi sương mù."
      },
      "wealth": {
        "upright": "Độ minh bạch thấp — hãy nhìn xuyên qua để thấy tài sản cơ sở.",
        "reversed": "Trò lừa đảo bị nhìn thấu, hoặc sổ sách cuối cùng được sắp xếp gọn gàng."
      },
      "health": {
        "upright": "Rối loạn giấc ngủ, lo âu, chu kỳ gắn với cảm xúc — hãy làm dịu tinh thần.",
        "reversed": "Sau chẩn đoán, chứng lo bệnh giảm nhẹ; nhịp ngủ được cải thiện."
      }
    }
  },
  {
    "id": "major_19",
    "numericId": 19,
    "name": "Mặt Trời (The Sun)",
    "nameEn": "The Sun",
    "type": "major",
    "meaning": {
      "upright": "Đứa trẻ trên lưng sư tử, bản ngã rạng rỡ, sự sống được tôn vinh",
      "reversed": "Bóng tối chưa hợp nhất, niềm vui quá đà, ánh sáng trẻ thơ lu mờ"
    },
    "description": "Dưới Mặt Trời, một đứa trẻ cưỡi sư tử trắng; hoa hướng dương nở rộ; bức tường mở ra thế giới bên kia. Lá sáng nhất trong Ẩn Chính — sinh lực, thành công, niềm vui ý thức. Bóng tối lùi bước; bản ngã đích thực mở ra như một đứa trẻ.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Mặt Trời mang đến thắng lợi, sự công nhận, niềm vui thuần khiết — nỗ lực được nhìn thấy, cơ thể tràn đầy sức sống. Đứa trẻ không diễn; sư tử không gây thương tích. Hãy chia sẻ ánh sáng; niềm vui lớn lên khi được sẻ chia.",
      "reversed": "Ở chiều ngược, mây che ngang mặt trời: vui vẻ bên ngoài, trống rỗng bên trong, ăn mừng như một màn trình diễn, hoặc thành công mà không biết bước tiếp theo. Sự tích cực khiên cưỡng có thể chôn vùi cảm xúc — hãy cho phép mình có những ngày xám."
    },
    "advice": {
      "upright": "Hãy ăn mừng điều mình đã làm ra. Chia sẻ niềm vui và sưởi ấm những người quanh bạn.",
      "reversed": "Nếu hạnh phúc có vẻ giả tạo, hãy hỏi bạn đang cố chứng minh điều gì. Thành công vẫn cần chỗ cho bóng tối."
    },
    "categories": {
      "love": {
        "upright": "Tình yêu công khai, hôn lễ, sinh nở — mối gắn bó ấm áp và rõ ràng.",
        "reversed": "Màn phô diễn che giấu rắc rối, hoặc vết thương cũ vẫn phủ bóng lên một trái tim."
      },
      "career": {
        "upright": "Thành công, thăng tiến, được chú ý — hãy tận dụng đà này khi nó còn.",
        "reversed": "Cô đơn trên đỉnh cao, hoặc lòng kiêu hãnh sau thắng lợi khiến bạn sảy chân."
      },
      "wealth": {
        "upright": "Thu nhập tăng, tiền thưởng về tay — hãy hưởng thụ chừng mực và để dành.",
        "reversed": "Ăn mừng lố tay, hoặc thu nhập bấp bênh mà vẫn lạc quan mù quáng."
      },
      "health": {
        "upright": "Sinh lực mạnh, hồi phục nhanh — hoạt động ngoài trời rất tuyệt vời.",
        "reversed": "Nắng và nghỉ ngơi bị bỏ qua, hoặc kiệt sức bị che bằng nụ cười gượng."
      }
    }
  },
  {
    "id": "major_20",
    "numericId": 20,
    "name": "Phán Xét (Judgement)",
    "nameEn": "Judgement",
    "type": "major",
    "meaning": {
      "upright": "Tiếng kèn đánh thức, nghiệp quả hiện lên, tái sinh bằng lựa chọn",
      "reversed": "Tự phán xét khắc nghiệt, chậm đáp lời gọi, món nợ cũ bám riết"
    },
    "description": "Tổng lãnh thiên thần Gabriel thổi kèn; những hình người vùng dậy khỏi quan tài giữa biển và núi. Phán Xét là sự thức tỉnh tâm linh, tinh thần chịu trách nhiệm và cơ hội thứ hai — quá khứ được gọi ra ánh sáng, tái sinh qua tha thứ và lựa chọn.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Phán Xét vang lên một tiếng gọi ở tầng linh hồn — nghiệp quả được thanh tẩy, sự thật muộn màng xuất hiện, khoảnh khắc thức tỉnh đến. Bạn có thể đáp lời: thừa nhận quá khứ, xin và trao tha thứ, sống bằng một cái tên mới. Đây là tái sinh, không phải bản án vĩnh viễn.",
      "reversed": "Ở chiều ngược, tiếng kèn bị bịt lại: tự xét xử tàn nhẫn, từ chối tha thứ cho mình hoặc cho người khác, hoặc ngủ quên trong khi thay đổi gõ cửa. Món nợ cũ lặp lại cho đến khi được trả lời. Coi chừng tự nhốt mình trong vai nạn nhân dưới danh nghĩa \"phán xét\"."
    },
    "advice": {
      "upright": "Hãy nghe tiếng gọi bên trong. Nhìn lại một cách trung thực. Hãy chọn buông bỏ và tái sinh — tha thứ là chìa khóa.",
      "reversed": "Hãy ngừng tự buộc tội không ngừng nghỉ. Đừng từ chối trưởng thành. Nếu tiếng gọi đã đến, trì hoãn chỉ thêm nặng nề."
    },
    "categories": {
      "love": {
        "upright": "Tình cũ được nhìn lại; tái hợp cần thay đổi thật sự, hoặc mối quan hệ vươn lên giai đoạn mới.",
        "reversed": "Đào lại nỗi đau cũ để làm nhau tổn thương, hoặc từ chối một cơ hội thứ hai chân thành."
      },
      "career": {
        "upright": "Đánh giá, bảo vệ, thẩm định công khai — công việc trong quá khứ sẽ được nhìn nhận.",
        "reversed": "Cảm giác kẻ giả danh hoặc từ chối phản hồi khiến bạn mất cơ hội thăng tiến."
      },
      "wealth": {
        "upright": "Thừa kế, đòi nợ, món nợ cũ được tất toán — chương tài chính khép lại.",
        "reversed": "Nợ nần hoặc thuế má bị né tránh cho đến khi càng lúc càng tệ."
      },
      "health": {
        "upright": "Kết quả xét nghiệm thúc đẩy thay đổi lối sống thật sự; bước ngoặt hồi phục.",
        "reversed": "Biết rõ mà không làm, hoặc lo lắng về các chỉ số mà không hành động."
      }
    }
  },
  {
    "id": "major_21",
    "numericId": 21,
    "name": "Thế Giới (The World)",
    "nameEn": "The World",
    "type": "major",
    "meaning": {
      "upright": "Vũ điệu hoàn tất, bốn nguyên tố hợp nhất, vòng tròn khép kín",
      "reversed": "Thiếu dặm cuối, vòng lặp chưa xong, thành tựu trống rỗng"
    },
    "description": "Thế Giới cho thấy một vũ công trong vòng nguyệt quế; gậy, cốc, kiếm và đồng tiền ở bốn góc — hành trình hoàn tất, vũ trụ hợp nhất. Vòng tròn của Kẻ Khờ khép lại tại đây; linh hồn đã đi qua công trình lớn lao và có thể ăn mừng hoặc lại lên đường.",
    "interpretation": {
      "upright": "Ở chiều xuôi, Thế Giới đánh dấu sự hoàn tất lớn — mục tiêu đạt được, bằng cấp nhận được, chuyển nhà xong xuôi, dự án bàn giao trọn vẹn. Bốn nguyên tố về đúng vị trí của chúng. Vũ công vẫn chuyển động; hoàn tất chính là mẹ của khởi đầu kế tiếp.",
      "reversed": "Ở chiều ngược, vòng tròn thiếu một mắt xích — xong chín mươi chín phần trăm, chứng nhận bị hoãn, giấy tờ mắc kẹt, hoặc thành tựu mà bên trong vẫn không thấy thật. Đôi khi nỗi sợ kết thúc làm chậm bước cuối cùng."
    },
    "advice": {
      "upright": "Hãy tôn vinh trọn vẹn hành trình. Đánh dấu cột mốc. Rồi mở chương kế tiếp bằng con người bạn đã trở thành.",
      "reversed": "Hãy gọi tên điểm đang mắc kẹt và gỡ nó. Nếu thành công thấy trống rỗng, hãy hỏi tầm nhìn nào đang đến."
    },
    "categories": {
      "love": {
        "upright": "Cam kết được viên mãn, sum họp vượt khoảng cách, mối gắn bó ổn định và trọn vẹn.",
        "reversed": "Hôn lễ bị hoãn, yêu xa chưa ổn định, hoặc ở bên nhau về hình thức mà không về trái tim."
      },
      "career": {
        "upright": "Bàn giao, tốt nghiệp, cột mốc khởi nghiệp — hãy hướng tầm nhìn ra toàn cầu.",
        "reversed": "Những việc cuối kéo dài lê thê, hoặc thành công mà không có kế hoạch kế tiếp."
      },
      "wealth": {
        "upright": "Mục tiêu tài chính đã đạt; việc phân bổ bước vào giai đoạn chín muồi.",
        "reversed": "Tiền bạc hoặc giấy tờ thiếu ở ngưỡng cửa — đừng lơ là trước vạch đích."
      },
      "health": {
        "upright": "Điều trị hoàn tất, mục tiêu cơ thể đạt được — hợp nhất và ổn định.",
        "reversed": "Giai đoạn cuối của phục hồi bị bỏ bê, hoặc còn thiếu một mảnh của lối sống."
      }
    }
  },
  {
    "id": "wands_ace",
    "numericId": 22,
    "name": "Gậy Át",
    "nameEn": "Wands Ace",
    "type": "minor",
    "suit": "wands",
    "number": 1,
    "meaning": {
      "upright": "Khởi đầu mới, nguồn cảm hứng, tiềm năng, cơ hội khởi nghiệp",
      "reversed": "Trì hoãn xuất phát, phương hướng mơ hồ, nhiệt huyết phai nhạt, bỏ lỡ thời điểm"
    },
    "description": "Lá Át Gậy là ngọn lửa đầu tiên trong tay — nguồn cội của hành động và tia sáng đầu tiên của sự sáng tạo. Ở chiều xuôi, một dự định mới hay một khát vọng mới đang chờ bạn châm lên.",
    "interpretation": {
      "upright": "Một lá bài của nguyên tố lửa đứng ngay ngưỡng cửa — cảm hứng và cơ hội đến cùng lúc. Trong lòng bạn đã biết câu trả lời; chỉ còn thiếu bước đi đầu tiên để biến tiềm năng thành hành động hữu hình.",
      "reversed": "Ngọn lửa chưa thật sự bén, hoặc kế hoạch cứ đình trệ mãi. Khả năng vẫn còn đó, nhưng thời điểm, sự tự tin hay khâu chuẩn bị chưa đủ — hãy làm rõ điều bạn thực sự muốn dựng xây."
    },
    "advice": {
      "upright": "Nắm bắt tia lửa ấy. Hãy làm một việc nhỏ nhất có thể và để ngọn lửa tự bén lan.",
      "reversed": "Tạm dừng những khởi đầu mù quáng. Xác nhận rõ phương hướng và động cơ trước khi dồn sức cho một dự án đáng giá."
    },
    "categories": {
      "love": {
        "upright": "Một mối tình mới hoặc một tia rung động đang hé nở — bày tỏ chân thành có thể gặp được hồi đáp.",
        "reversed": "Đà tiến trong chuyện tình cảm còn yếu, hoặc bốc đồng mà không theo đến cùng — hãy hiểu lòng mình trước đã."
      },
      "career": {
        "upright": "Dự án, vị trí hay cơ hội khởi nghiệp mới đang mở ra — hãy thể hiện óc sáng tạo và sự quyết tâm.",
        "reversed": "Kế hoạch bị gác lại hoặc phương hướng dao động — tránh nhảy việc vội vàng hay phát động điều gì quá lớn."
      },
      "wealth": {
        "upright": "Một nguồn thu mới hoặc một khoản đầu tư nhỏ đáng để thử ở quy mô khiêm tốn.",
        "reversed": "Kiềm chế bốc đồng tài chính; những dự định còn non chưa phù hợp để dồn vốn lớn."
      },
      "health": {
        "upright": "Năng lượng trở lại — hãy bắt đầu tập luyện hay một thói quen chăm sóc sức khỏe mới; ngọn lửa phục hồi sinh khí.",
        "reversed": "Sự trì hoãn hoặc mệt mỏi khiến bạn bỏ bê cơ thể — hãy lập lại nhịp sống bằng những mục tiêu nhỏ."
      }
    }
  },
  {
    "id": "wands_two",
    "numericId": 23,
    "name": "Gậy Hai",
    "nameEn": "Wands Two",
    "type": "minor",
    "suit": "wands",
    "number": 2,
    "meaning": {
      "upright": "Tầm nhìn quy hoạch, cái nhìn xa, chờ thời điểm, giữ vững thế trận",
      "reversed": "Không có kế hoạch, thu mình lại, tầm nhìn hạn hẹp, bỏ lỡ cơ hội"
    },
    "description": "Lá Hai Gậy vẽ hình người cầm quả địa cầu trong tay — ngọn lửa đã chuyển thành tầm nhìn và sắp đặt. Ở chiều xuôi, bạn đang đứng trước một ngã rẽ và nhìn về một tương lai xa hơn.",
    "interpretation": {
      "upright": "Bạn có đủ nguồn lực và tầm nhìn để cân nhắc bước mở rộng kế tiếp. Đây là lúc vừa hoạch định vừa dừng lại — chưa cần vội hành động, nhưng phương hướng phải sắc nét hơn.",
      "reversed": "Lo lắng về tương lai, hoặc quá nhiều lựa chọn khiến bạn chôn chân tại chỗ. Sợ hãi trước những chậm trễ chưa biết, hoặc kế hoạch quá lớn lao mà thiếu bước đi khả thi."
    },
    "advice": {
      "upright": "Chia đường chân trời thành từng chặng. Chọn một con đường rồi tiến đều đặn.",
      "reversed": "Thu hẹp lựa chọn. Hãy đưa ra quyết định nhỏ nhất ngay trước mắt trước khi bàn đến chiến lược lớn."
    },
    "categories": {
      "love": {
        "upright": "Mối quan hệ đang được cân nhắc kỹ lưỡng — có thể tính đến tương lai chung mà chưa cần vội thề nguyền.",
        "reversed": "Do dự hoặc né tránh chuyện cam kết — hãy thành thật về việc mình có còn muốn tiếp tục đầu tư hay không."
      },
      "career": {
        "upright": "Rất hợp để hoạch định sự nghiệp dài hạn — việc ra nước ngoài, chuyển lĩnh vực hay mở rộng đều đáng cân nhắc.",
        "reversed": "Phương hướng mơ hồ hoặc tham vọng vượt xa thực lực — hãy củng cố nền tảng hiện tại trước."
      },
      "wealth": {
        "upright": "Hãy suy nghĩ dài hạn về tài chính — phân tán rủi ro tốt hơn một canh bạc liều lĩnh.",
        "reversed": "Kế hoạch đầu tư mơ hồ hoặc quá thận trọng — hãy tìm hiểu kỹ trước khi quyết định."
      },
      "health": {
        "upright": "Đặt ra những mục tiêu sức khỏe bền vững — phòng bệnh hơn chữa bệnh.",
        "reversed": "Việc chăm sóc lâu dài bị bỏ quên hoặc kế hoạch bị bỏ dở — hãy cam kết với một thói quen duy nhất."
      }
    }
  },
  {
    "id": "wands_three",
    "numericId": 24,
    "name": "Gậy Ba",
    "nameEn": "Wands Three",
    "type": "minor",
    "suit": "wands",
    "number": 3,
    "meaning": {
      "upright": "Mở rộng, tầm nhìn lãnh đạo, thành quả đang tới gần, tinh thần đồng đội",
      "reversed": "Tiến độ bế tắc, kỳ vọng không thành, phối hợp kém, đi quá nhanh"
    },
    "description": "Lá Ba Gậy nhìn ra biển khơi — ngọn lửa đẩy tầm mắt vươn xa. Ở chiều xuôi, dự định đã được khởi động; thành quả đang hiện lên ở đường chân trời xa.",
    "interpretation": {
      "upright": "Nỗ lực ban đầu đã kết trái đầu tiên. Cánh cửa hợp tác và phát triển mở ra. Năng lực lãnh đạo và tầm nhìn của bạn được ghi nhận — hãy đưa công việc lên một sân khấu lớn hơn.",
      "reversed": "Việc mở rộng gặp lực cản; giao tiếp đình trệ khiến tiến độ chững lại. Sự lạc quan có thể đang xem nhẹ trở ngại, hoặc quy mô phình to trước khi bạn đủ sẵn sàng."
    },
    "advice": {
      "upright": "Tìm đến đồng minh và nguồn lực. Hãy cho thấy kết quả và tìm kiếm sự hợp tác lớn hơn.",
      "reversed": "Rà soát điểm nghẽn, điều chỉnh nhịp độ và vai trò — đừng vì một thất bại mà từ bỏ cả phương hướng."
    },
    "categories": {
      "love": {
        "upright": "Một mối liên hệ xa cách hoặc khác môi trường có thể sâu đậm hơn nếu bạn mở lòng.",
        "reversed": "Khoảng cách, lệch múi giờ hay khác biệt quan điểm gây ma sát — cần trò chuyện kiên nhẫn."
      },
      "career": {
        "upright": "Dự án bước vào mùa thu hoạch — thăng chức, cử đi công tác nước ngoài hay bước phát triển đều khá rõ ràng.",
        "reversed": "Đối tác sa sút hoặc thị trường kém như kỳ vọng — hãy linh hoạt chiến lược."
      },
      "wealth": {
        "upright": "Khoản đầu tư dài hạn hoặc nguồn thu phụ đang sinh lời — có thể bổ sung khiêm tốn vào những khoản tốt.",
        "reversed": "Thanh toán bị chậm hoặc chi phí mở rộng vượt dự tính — hãy ưu tiên dòng tiền trước."
      },
      "health": {
        "upright": "Du lịch ngoài trời và thể thao đồng đội nâng đỡ cả thân thể lẫn tinh thần.",
        "reversed": "Lịch trình quá dày — hãy dành chỗ cho việc hồi phục ngay trong kế hoạch mở rộng."
      }
    }
  },
  {
    "id": "wands_four",
    "numericId": 25,
    "name": "Gậy Bốn",
    "nameEn": "Wands Four",
    "type": "minor",
    "suit": "wands",
    "number": 4,
    "meaning": {
      "upright": "Ăn mừng, sum họp, nền tảng vững vàng, cảm giác thuộc về",
      "reversed": "Nền móng lung lay, chuyển giao bất an, lễ ăn mừng bị hoãn, đánh mất chốn thuộc về"
    },
    "description": "Lá Bốn Gậy là cổng chào kết hoa — ngọn lửa đã ấm lên thành sợi dây gắn bó giữa người với người. Ở chiều xuôi, một cột mốc đáng được nâng ly và quây quần.",
    "interpretation": {
      "upright": "Nỗ lực đã đổi lấy một khoảnh khắc để ăn mừng — tổ ấm, tập thể hay cộng đồng đang hòa hợp. Đây là thời điểm tốt để bồi đắp gốc rễ và tận hưởng cảm giác thuộc về.",
      "reversed": "Nỗi lo thầm kín ẩn dưới vẻ yên ổn — việc chuyển nhà, thay đổi nhân sự hay một vết nứt trong quan hệ làm lung lay sự ổn định. Hãy vá lại nền móng trước khi mở tiệc."
    },
    "advice": {
      "upright": "Chia sẻ niềm vui với những người thực sự quan trọng. Củng cố mạng lưới quan hệ và nền tảng vật chất.",
      "reversed": "Hàn gắn rạn nứt trong gia đình hay tập thể trước. Kiên nhẫn đi qua giai đoạn chuyển giao."
    },
    "categories": {
      "love": {
        "upright": "Bàn chuyện kết hôn, ra mắt gia đình hai bên hoặc về sống chung đều thuận — ngọt ngào và bền vững.",
        "reversed": "Gia đình phản đối hoặc lễ cưới có thay đổi — hãy cùng nhau đứng vững trước áp lực bên ngoài."
      },
      "career": {
        "upright": "Một giai đoạn đã hoàn tất, tinh thần lên cao — rất hợp để tập thể ăn mừng hoặc ghi nhận đóng góp.",
        "reversed": "Chuyện thị phi công sở hoặc tái cơ cấu làm xáo trộn sự ổn định — hãy giữ khiêm tốn và hợp tác."
      },
      "wealth": {
        "upright": "Bất động sản, sửa sang nhà cửa hoặc tài chính chung trong gia đình có thể đúng thời điểm.",
        "reversed": "Khoản chi lớn bị chặn hoặc tranh chấp tiền bạc trong nhà — hãy bàn bạc kỹ trước quyết định lớn."
      },
      "health": {
        "upright": "Tương đối cân bằng — sự quan tâm của gia đình và nếp sinh hoạt đều đặn giúp hồi phục.",
        "reversed": "Thay đổi môi trường hoặc căng thẳng làm gián đoạn giấc ngủ — hãy tạo một không gian nghỉ ngơi yên tĩnh."
      }
    }
  },
  {
    "id": "wands_five",
    "numericId": 26,
    "name": "Gậy Năm",
    "nameEn": "Wands Five",
    "type": "minor",
    "suit": "wands",
    "number": 5,
    "meaning": {
      "upright": "Cạnh tranh, bất đồng, ma sát nội tâm, xung đột thế lực",
      "reversed": "Xung đột lắng xuống, cuộc tranh đấu vô nghĩa khép lại, tìm được tiếng nói chung"
    },
    "description": "Lá Năm Gậy vẽ những nhân vật đan chéo gậy vào nhau — ngọn lửa va đập trong ganh đua. Chiều xuôi không hẳn là điềm dữ; đôi khi chính ma sát lại rèn nên hình hài tốt đẹp hơn.",
    "interpretation": {
      "upright": "Lợi ích và quan điểm đụng nhau — công việc, tập thể hay gia đình có thể nổi lên tranh chấp công khai hoặc ngấm ngầm. Năng lượng bị hao tán, nhưng nếu giữ được tính xây dựng, một phương án tốt hơn có thể ra đời.",
      "reversed": "Cuộc tranh cãi gay gắt dịu lại, hoặc bạn rời bỏ một cuộc đua vô nghĩa. Ít hao tổn nội tâm hơn — nhưng hãy coi chừng việc chôn vùi vấn đề thay vì giải quyết nó."
    },
    "advice": {
      "upright": "Giữ cho mục tiêu cốt lõi luôn rõ ràng. Kiên định trong cạnh tranh; hòa giải khi cần.",
      "reversed": "Rút khỏi cuộc cãi vã rỗng tuếch. Dồn sức cho điều thực sự quan trọng."
    },
    "categories": {
      "love": {
        "upright": "Những lời cãi vặt có thể là cách thể hiện sự quan tâm — dù vậy vẫn phải giữ ý tứ trong lời nói.",
        "reversed": "Chiến tranh lạnh kết thúc hoặc mối hận cũ được buông bỏ — hãy cho nhau khoảng lặng để nguôi."
      },
      "career": {
        "upright": "Cạnh tranh gay gắt — hãy giành nguồn lực và cơ hội bằng bản lĩnh và khả năng đàm phán.",
        "reversed": "Sự ganh đua độc hại nguội dần — hợp tác có thể thay thế chiến tranh."
      },
      "wealth": {
        "upright": "Việc trả giá trên thị trường căng thẳng hơn — hãy bảo vệ biên lợi nhuận.",
        "reversed": "Tranh chấp tiền bạc có thể được dàn xếp — đừng đẩy căng thêm nữa."
      },
      "health": {
        "upright": "Căng thẳng và tranh cãi ảnh hưởng đến giấc ngủ lẫn tính khí — hãy vận động và tránh thức khuya.",
        "reversed": "Căng thẳng dịu bớt — yoga và thiền sẽ hữu ích."
      }
    }
  },
  {
    "id": "wands_six",
    "numericId": 27,
    "name": "Gậy Sáu",
    "nameEn": "Wands Six",
    "type": "minor",
    "suit": "wands",
    "number": 6,
    "meaning": {
      "upright": "Thắng lợi, được công nhận trước đám đông, tỏa sáng tự tin, uy tín giành bằng thực lực",
      "reversed": "Danh tiếng sứt mẻ, kỳ vọng hão huyền, ganh đua ngấm ngầm, chiến thắng rỗng ruột"
    },
    "description": "Lá Sáu Gậy là đoàn diễu hành khải hoàn — ngọn lửa đã cháy thành vinh quang hữu hình. Ở chiều xuôi, nỗ lực được nhìn thấy; sự tự tin và vị thế cùng nhau đi lên.",
    "interpretation": {
      "upright": "Phần thưởng và sự ghi nhận đến từ cấp trên, đồng nghiệp hay công chúng. Hãy tận hưởng thắng lợi và củng cố vị thế lãnh đạo — nhưng giữ khiêm nhường để tránh sinh thêm kẻ đối đầu.",
      "reversed": "Lời khen mong đợi bị trì hoãn, hoặc thành công khơi lên ghen tị và cản trở. Nỗi tự hoài nghi có thể trỗi dậy — hãy tách tiếng ồn khỏi sự thật."
    },
    "advice": {
      "upright": "Đón nhận tràng vỗ tay và cảm ơn những người đã ủng hộ — hãy để thắng lợi này thành khởi đầu kế tiếp.",
      "reversed": "Đừng màng đến danh hão; hãy làm cho ra việc. Nếu bị chèn ép, hãy đáp lại bằng thực chất."
    },
    "categories": {
      "love": {
        "upright": "Bạn tỏa sáng trong tình yêu — thời điểm tỏ tình hoặc công khai rất thuận.",
        "reversed": "Tín hiệu lẫn lộn hoặc người ngoài nghi ngờ — đừng diễn kịch thay vì nói lên sự thật."
      },
      "career": {
        "upright": "Thăng chức, giải thưởng hoặc thắng dự án rất khả thi — hãy tìm sự hiện diện và tiếng nói.",
        "reversed": "Công lao bị chiếm đoạt hoặc bị đánh giá bất công — hãy ghi lại bằng chứng và làm rõ với cấp trên."
      },
      "wealth": {
        "upright": "Thưởng hoặc cổ tức đến theo sau uy tín — thu nhập có thể tăng cùng tên tuổi.",
        "reversed": "Thù lao không tương xứng với công sức, hoặc chi tiêu phô trương khiến bạn bị để ý sai chỗ."
      },
      "health": {
        "upright": "Tinh thần hưng phấn nhờ thành tựu — hãy giữ mình khỏi bị kích động quá độ.",
        "reversed": "Thất bại ảnh hưởng đến cảm xúc lẫn sức đề kháng — hãy dựng lại sự tự tin từ những thắng lợi nhỏ."
      }
    }
  },
  {
    "id": "wands_seven",
    "numericId": 28,
    "name": "Gậy Bảy",
    "nameEn": "Wands Seven",
    "type": "minor",
    "suit": "wands",
    "number": 7,
    "meaning": {
      "upright": "Giữ vững vị trí, thế yếu một chống nhiều, chịu áp lực, ý chí không lay chuyển",
      "reversed": "Phòng tuyến vỡ, quá tải, bỏ cuộc, tự tin lung lay"
    },
    "description": "Lá Bảy Gậy vẽ một người đứng trên đồi cao đẩy lùi những cây gậy từ bên dưới — ngọn lửa hóa thành lòng can đảm đơn độc. Ở chiều xuôi, thế bất lợi vẫn còn, nhưng ý chí cố thủ rất mạnh.",
    "interpretation": {
      "upright": "Thách thức đến từ nhiều phía — bạn có thể cảm thấy bị áp đảo về số lượng. Nhưng địa thế đang có lợi cho bạn; nếu giữ vững nguyên tắc và ranh giới, cục diện vẫn có thể đảo chiều.",
      "reversed": "Phòng thủ lâu dài làm cạn kiệt cả thân lẫn tâm; nỗi hoài nghi lớn dần xem cuộc chiến có đáng hay không. Việc phòng vệ quá mức có thể khiến bạn bỏ lỡ cơ hội chuyển hướng — hãy chọn cố thủ hoặc rút lui có chiến lược."
    },
    "advice": {
      "upright": "Tập trung cho trận đánh chính. Tìm đồng minh để chia sẻ gánh nặng.",
      "reversed": "Đánh giá cán cân thực tế. Hãy điều chỉnh chiến thuật hoặc lùi một bước để giữ sức."
    },
    "categories": {
      "love": {
        "upright": "Có sự phản đối từ bên ngoài hoặc áp lực từ người thứ ba — hãy đứng vững và nói lên sự thật.",
        "reversed": "Những bức tường quá dày hoặc các cuộc tranh cãi đã cạn sức — hãy biết khi nào nên giữ, khi nào nên buông."
      },
      "career": {
        "upright": "Phải bảo vệ vị trí công việc, qua kỳ đánh giá hay dự án bị vây ép — bản lĩnh và sự bền bỉ có thể giúp bạn vượt qua.",
        "reversed": "Quá tải hoặc bị cô lập — hãy nhờ giúp đỡ hoặc phân chia lại công việc."
      },
      "wealth": {
        "upright": "Bảo vệ tài sản và tiền mặt trước biến động hoặc sự chèn ép giá.",
        "reversed": "Áp lực tài chính đã tới giới hạn — tránh đòn bẩy cao; hãy cắt lỗ kịp thời."
      },
      "health": {
        "upright": "Bệnh mạn tính cần được quản lý lâu dài — hãy kiên trì với phác đồ và nhịp sinh hoạt.",
        "reversed": "Cơ thể đã suy kiệt rõ rệt — hãy nghỉ ngơi và giảm tải, nếu không sẽ gãy."
      }
    }
  },
  {
    "id": "wands_eight",
    "numericId": 29,
    "name": "Gậy Tám",
    "nameEn": "Wands Eight",
    "type": "minor",
    "suit": "wands",
    "number": 8,
    "meaning": {
      "upright": "Tiến nhanh, tin tức đang tới, di chuyển gấp gáp, đà chuyển động mạnh",
      "reversed": "Chậm trễ, thông tin rối loạn, gấp gáp mà không tới đích, mất nhịp"
    },
    "description": "Lá Tám Gậy phóng tám cây gậy xuyên qua khoảng không rộng mở — ngọn lửa mang hình hài của tốc độ và đà tiến. Ở chiều xuôi, mọi việc lao về phía trước; tin tức hằng mong đợi đã đến rất gần.",
    "interpretation": {
      "upright": "Những việc tưởng chừng đình trệ bỗng tăng tốc — đi lại, trao đổi, dự án đều nhanh hơn. Hãy thuận theo con sóng nhưng giữ cho các chi tiết khớp với nhịp độ.",
      "reversed": "Kế hoạch trượt dốc, thông tin rối tung. Sự vội vàng sinh ra sai sót — hãy lập lại lịch trình và kênh liên lạc."
    },
    "advice": {
      "upright": "Hãy hành động trong khung thời gian thuận lợi. Xác nhận những dữ kiện then chốt trước khi ký kết.",
      "reversed": "Chậm lại nửa nhịp. Làm rõ thứ tự ưu tiên — đừng đưa ra quyết định lớn giữa lúc hỗn loạn."
    },
    "categories": {
      "love": {
        "upright": "Chuyện tình cảm nóng lên nhanh — lời tỏ tình, cuộc hội ngộ hoặc chuyến thăm có thể đến sớm.",
        "reversed": "Nói nhanh sinh hiểu lầm, hoặc cảm xúc thất thường — hãy xác nhận rõ ý định của nhau."
      },
      "career": {
        "upright": "Hạn chót gấp nhưng khả thi — có thể có chuyến công tác, điều chuyển hay lời đề nghị bất ngờ.",
        "reversed": "Quy trình tắc nghẽn, thư từ bị bỏ sót, đồng nghiệp để rơi việc — hãy tạo khoảng đệm thời gian."
      },
      "wealth": {
        "upright": "Khoản thanh toán có thể về nhanh — cơ hội ngắn cần sự dứt khoát, không phải lòng tham.",
        "reversed": "Thanh toán bị chậm hoặc giấy tờ đình trệ — hãy kiên nhẫn theo đuổi đến cùng."
      },
      "health": {
        "upright": "Quá trình hồi phục tăng tốc — hãy tăng cường độ tập luyện từ từ để tránh chấn thương.",
        "reversed": "Giấc ngủ thất thường hoặc mệt mỏi vì di chuyển — hãy chú ý giao thông và an toàn."
      }
    }
  },
  {
    "id": "wands_nine",
    "numericId": 30,
    "name": "Gậy Chín",
    "nameEn": "Wands Nine",
    "type": "minor",
    "suit": "wands",
    "number": 9,
    "meaning": {
      "upright": "Bị thương nhưng vẫn cảnh giác, thử thách cuối cùng, sức bền, ranh giới được giữ chặt",
      "reversed": "Kiệt sức, cảnh giác quá mức, bỏ cuộc khi đích đến đã gần, vết thương chưa lành"
    },
    "description": "Lá Chín Gậy là người lính canh quấn băng — ngọn lửa đã cháy yếu nhưng chưa tắt. Ở chiều xuôi, đây là phép thử cuối cùng trước vạch đích.",
    "interpretation": {
      "upright": "Bạn đã đi qua nhiều vòng đấu; mệt mỏi là thật nhưng bạn vẫn trụ được. Thắng lợi đã rất gần — cú bứt phá cuối cần sự bền bỉ và một ranh giới rõ ràng.",
      "reversed": "Cảnh giác lâu ngày sinh ra hoang tưởng và cạn kiệt năng lượng; vết thương cũ có thể rách lại dưới áp lực. Việc phòng vệ quá mức khiến bạn từ chối những hỗ trợ cần thiết."
    },
    "advice": {
      "upright": "Cố thêm một chút nữa; hãy nhận sự hỗ trợ — đừng một mình vác hết gánh nặng.",
      "reversed": "Nghỉ ngơi và chữa lành. Cởi bỏ lớp giáp không cần thiết. Dựng lại niềm tin từng bước chậm rãi."
    },
    "categories": {
      "love": {
        "upright": "Từng bị tổn thương nhưng vẫn sẵn lòng thử lại — mối quan hệ có thể sâu đậm hơn sau phép thử.",
        "reversed": "Nghi ngờ và những bức tường ngăn cản sự thân mật — trò chuyện thẳng thắn hoặc tìm đến chuyên gia có thể giúp ích."
      },
      "career": {
        "upright": "Chặng nước rút của dự án — làm thêm giờ có thể hoàn tất; hãy để ý tinh thần của tập thể.",
        "reversed": "Kiệt sức đã quá rõ — hãy nghỉ phép, giảm bớt việc hoặc dừng gắng gượng khi đang ốm."
      },
      "wealth": {
        "upright": "Giai đoạn thận trọng — quản lý tài chính cẩn thận qua quãng đường chật vật cuối cùng.",
        "reversed": "Lo lắng khiến bạn có những nước phòng thủ sai lầm — thoát ra quá sớm hoặc từ chối cơ hội tốt."
      },
      "health": {
        "upright": "Bệnh cũ tái phát nhưng vẫn trong tầm kiểm soát — hãy hoàn thành đủ liệu trình được chỉ định.",
        "reversed": "Mệt mỏi mạn tính và mất ngủ cần được chăm sóc có hệ thống — hãy để ý sức đề kháng."
      }
    }
  },
  {
    "id": "wands_ten",
    "numericId": 31,
    "name": "Gậy Mười",
    "nameEn": "Wands Ten",
    "type": "minor",
    "suit": "wands",
    "number": 10,
    "meaning": {
      "upright": "Gánh nặng lớn, ôm đồm mọi việc, trách nhiệm đè trên vai, quá tải",
      "reversed": "Đặt gánh nặng xuống, từ chối phần vượt sức, giao bớt việc, đánh mất mục tiêu"
    },
    "description": "Lá Mười Gậy vẽ một người vác cả mười cây gậy — ngọn lửa đã cháy hết thành bổn phận. Ở chiều xuôi, thành tựu và sức nặng nghiền nát cùng đến một lúc.",
    "interpretation": {
      "upright": "Bạn đang gánh gần như mọi thứ — trách nhiệm ở mức đỉnh điểm. Đích đến vẫn chạm tới được, nhưng nếu một mình vác hết, bạn có thể gục trước vạch đích.",
      "reversed": "Gánh nặng bắt đầu được nhìn nhận là bất công — đây là cơ hội để giao bớt hoặc từ chối. Quá nhiều việc có thể khiến bạn quên mất vì sao mình bắt đầu — hãy sắp xếp lại thứ tự ưu tiên."
    },
    "advice": {
      "upright": "Chuyển giao bớt công việc. Tập trung vào mắt xích then chốt — hoàn thành còn hơn hoàn hảo.",
      "reversed": "Buông bỏ những lời hứa không thiết yếu. Tìm lại lý do ban đầu của con đường này."
    },
    "categories": {
      "love": {
        "upright": "Bạn cho đi quá nhiều trong gia đình hoặc trong mối quan hệ đôi lứa — hãy bàn chuyện chia sẻ trước khi oán trách tích tụ.",
        "reversed": "Đừng tiếp tục vác một mình, hoặc hãy lùi khỏi mối quan hệ chỉ một chiều."
      },
      "career": {
        "upright": "Kiêm nhiều vai và chồng chất hạn chót — hãy thương lượng về nguồn lực và thứ tự ưu tiên với cấp trên.",
        "reversed": "Chuyển việc, nghỉ việc hoặc từ chối dự án để lấy lại nhịp độ bền vững."
      },
      "wealth": {
        "upright": "Áp lực từ việc chu cấp gia đình và các khoản nợ — hãy lập ngân sách và cắt những khoản không thiết yếu.",
        "reversed": "Cắt bỏ khoản nợ xấu hoặc món đầu tư chết — hãy làm nhẹ chiếc ba lô tài chính."
      },
      "health": {
        "upright": "Nguy cơ căng cứng cổ, vai và lưng — nghỉ ngơi và giãn cơ là bắt buộc.",
        "reversed": "Hãy hồi phục sau giai đoạn làm việc quá sức — xây dựng nhịp sống bạn có thể duy trì lâu dài."
      }
    }
  },
  {
    "id": "wands_page",
    "numericId": 32,
    "name": "Gậy Tiểu Đồng",
    "nameEn": "Wands Page",
    "type": "minor",
    "suit": "wands",
    "number": 11,
    "meaning": {
      "upright": "Người khám phá tò mò, sứ giả nhiệt thành, mầm sáng tạo, tinh thần tự do",
      "reversed": "Nhiệt huyết chóng tàn, tin tức bị trì hoãn, sợ bắt đầu, sáng tạo bế tắc"
    },
    "description": "Lá Tiểu Đồng Gậy cầm cây gậy đang nảy mầm — ngọn lửa vừa được châm, đầy tò mò và thử nghiệm. Ở chiều xuôi, lá bài mang đến tin tức, mối quan tâm mới, và khát khao học hỏi.",
    "interpretation": {
      "upright": "Ngọn lửa của tuổi trẻ — bạn có thể nhận được tin tức thú vị hoặc thấy mình bị cuốn về một lĩnh vực nào đó. Hãy khám phá với tâm thế vui chơi; thành quả ban đầu chưa cần vội.",
      "reversed": "Nhiệt tình bùng lên rồi tắt ngấm, hoặc ý tưởng nằm im một chỗ. Tin tức bị trì hoãn hay nỗi sợ thất bại đang chặn bước đi đầu tiên."
    },
    "advice": {
      "upright": "Giữ tâm thế người mới. Những thử nghiệm nhỏ để đam mê dẫn dắt.",
      "reversed": "Chọn một việc và theo ít nhất hai tuần — biến tia lửa thành một kết quả nhỏ hữu hình."
    },
    "categories": {
      "love": {
        "upright": "Một tin nhắn thả thính hoặc một rung động mới — những buổi hẹn nhẹ nhàng hợp hơn thề nguyện nặng nề.",
        "reversed": "Sự mập mờ chẳng đi đến đâu, hoặc tình cảm đơn phương cứ im lặng — hãy hạ thấp rào cản trong lòng."
      },
      "career": {
        "upright": "Thực tập, khóa đào tạo, học chéo lĩnh vực — hãy xây dựng kỹ năng mới.",
        "reversed": "Làm việc hời hợt hoặc nhảy việc liên tục — hãy rèn sự ổn định và tay nghề."
      },
      "wealth": {
        "upright": "Thử nghiệm nhỏ với kênh tài chính mới hoặc nghề tay trái — hãy học trước đã.",
        "reversed": "Chi tiêu bốc đồng hoặc đầu tư thua lỗ — hãy ghi chép thu chi mỗi ngày."
      },
      "health": {
        "upright": "Thử môn thể thao hay chế độ ăn mới — sự tò mò giúp thói quen dễ thành hình.",
        "reversed": "Ngủ nghỉ thất thường và thức khuya chơi game — hãy nhẹ nhàng khôi phục nếp sống kỷ luật."
      }
    }
  },
  {
    "id": "wands_knight",
    "numericId": 33,
    "name": "Gậy Kỵ Sĩ",
    "nameEn": "Wands Knight",
    "type": "minor",
    "suit": "wands",
    "number": 12,
    "meaning": {
      "upright": "Hành động táo bạo, phiêu lưu, theo đuổi đầy đam mê, kỵ sĩ xung phong",
      "reversed": "Vội vàng liều lĩnh, cuộc xung phong dang dở, giận dữ, tốc độ vô định hướng"
    },
    "description": "Lá Kỵ Sĩ Gậy phi nước đại với cây gậy giơ cao — ngọn lửa mang hình hài của hành động và rủi ro. Ở chiều xuôi, mọi rào cản bị phá tan nhanh chóng; nhưng ngọn lửa không được kiểm soát sẽ thiêu rụi chính mình.",
    "interpretation": {
      "upright": "Năng lượng và quyết tâm đạt đỉnh — đi lại, theo đuổi mục tiêu và những khởi đầu mạnh mẽ đều thích hợp lúc này. Bạn đặt cược và xung phong nhiều hơn thường lệ; kết quả phụ thuộc vào tốc độ và sự quyết đoán.",
      "reversed": "Bốc đồng gây rắc rối; lời hứa chạy trước khả năng thực hiện; cơn giận phá vỡ kế hoạch lẫn mối quan hệ. Khởi đầu nhiều mà hoàn thành ít — hãy học cách đạp phanh."
    },
    "advice": {
      "upright": "Đặt ra giới hạn dưới và điểm rút lui trước khi xung phong. Chỉ nhắm vào ngọn lửa đã được kiểm chứng.",
      "reversed": "Trì hoãn quyết định lớn hai mươi bốn giờ. Hãy đốt bớt ngọn lửa dư thừa bằng vận động hoặc viết lách."
    },
    "categories": {
      "love": {
        "upright": "Theo đuổi mãnh liệt, tình yêu chớp nhoáng, cùng nhau phiêu lưu — hãy thành thật mà theo kịp nhịp của nhau.",
        "reversed": "Cãi vã, chiến tranh lạnh, hoặc ra đi không chút bận tâm — sự tiết chế mới chứng minh tình yêu, không phải tổn thương."
      },
      "career": {
        "upright": "Điều chuyển, khởi nghiệp, đấu thầu đều hợp với thế tấn công nhanh — sự dứt khoát giành lợi thế.",
        "reversed": "Nổi nóng mà xin nghỉ việc hay đắc tội khách hàng — hãy nguội lại trước khi thay đổi lớn."
      },
      "wealth": {
        "upright": "Giao dịch ngắn hạn hoặc đặt cược vào dự án mới chỉ nên dùng khoản vốn chấp nhận được mất.",
        "reversed": "Tiêu tiền như cờ bạc hoặc sụp đổ tài chính — hãy dừng lỗ và tìm hiểu nguyên nhân."
      },
      "health": {
        "upright": "Tập luyện cường độ cao giải phóng năng lượng — hãy khởi động kỹ và theo dõi nhịp tim.",
        "reversed": "Viêm nhiễm, nguy cơ tai nạn, thức khuya và rượu bia — hãy giảm lại."
      }
    }
  },
  {
    "id": "wands_queen",
    "numericId": 34,
    "name": "Gậy Nữ Hoàng",
    "nameEn": "Wands Queen",
    "type": "minor",
    "suit": "wands",
    "number": 13,
    "meaning": {
      "upright": "Sức hút tự tin, sự ấm áp độc lập, khả năng lãnh đạo sáng tạo, ngọn lửa rạng rỡ",
      "reversed": "Kiểm soát ghen tuông, tự tin rỗng, đam mê cháy cạn, áp chế người khác"
    },
    "description": "Lá Nữ Hoàng Gậy ngồi trên ngai lửa — sự ấm áp và năng lực lãnh đạo đã chín muồi. Ở chiều xuôi, sức hút và khả năng thực thi song hành; bạn truyền lửa cho người khác mà không đè bẹp họ.",
    "interpretation": {
      "upright": "Sự tự tin, tính độc lập và sức hút hòa quyện cùng nhau. Bạn dẫn dắt trong công việc lẫn tình cảm bằng hơi ấm và lòng tử tế. Đây là đỉnh cao cho tiếng nói trước công chúng và việc nâng đỡ tập thể.",
      "reversed": "Ghen tuông, kiểm soát hoặc sự mạnh mẽ hà khắc có thể làm tổn thương chính mình và người khác. Bề ngoài rạng rỡ mà bên trong trống rỗng — ngọn lửa không có ranh giới sẽ thiêu rụi mọi người."
    },
    "advice": {
      "upright": "Hãy trao quyền cho người khác bằng sức hút của mình — sự tự tin không cần phải đè nén ai.",
      "reversed": "Hãy tự hỏi liệu nỗi bất an có đang điều khiển sự kiểm soát của bạn không. Hãy mềm lại và nạp đầy năng lượng cho chính mình."
    },
    "categories": {
      "love": {
        "upright": "Bạn rực sáng trong tình yêu — thu hút tốt và chủ động vun đắp sự thân mật.",
        "reversed": "Chiếm hữu hoặc so bì làm xói mòn niềm tin — hãy dành không gian cho đối phương và cho chính mình."
      },
      "career": {
        "upright": "Dẫn dắt, thuyết trình, đại diện cho thương hiệu — sức ảnh hưởng cá nhân là tài sản.",
        "reversed": "Giành công lao hoặc ra lệnh hà khắc làm tổn thương tập thể — hãy lãnh đạo bằng cảm hứng."
      },
      "wealth": {
        "upright": "Thương hiệu cá nhân, sáng tạo, thu nhập phụ — vốn xã hội sinh lời.",
        "reversed": "Chi tiêu vì sĩ diện hoặc đầu tư theo cảm xúc — hãy quay về với ngân sách."
      },
      "health": {
        "upright": "Sinh lực dồi dào — hãy uống đủ nước và chăm sóc làn da trong giai đoạn hỏa vượng.",
        "reversed": "Kiệt sức, căng thẳng nội tiết — hãy sắp xếp thời gian nghỉ ngơi thực sự."
      }
    }
  },
  {
    "id": "wands_king",
    "numericId": 35,
    "name": "Gậy Vua",
    "nameEn": "Wands King",
    "type": "minor",
    "suit": "wands",
    "number": 14,
    "meaning": {
      "upright": "Nhà lãnh đạo có tầm nhìn, tinh thần doanh nhân, uy quyền, sứ mệnh truyền lửa",
      "reversed": "Độc đoán, mục tiêu viển vông, mất lòng người theo, cây gậy phân tán"
    },
    "description": "Lá Vua Gậy là ngọn lửa ở độ chín toàn vẹn — nhà lãnh đạo và nhà chiến lược trưởng thành. Ở chiều xuôi, lá bài hợp nhất nguồn lực và biến tầm nhìn thành bản đồ có thể thực thi.",
    "interpretation": {
      "upright": "Năng lực lãnh đạo tự nhiên và trực giác kinh doanh — bạn định hướng và tập hợp phương tiện. Sự chính trực cùng lòng dũng cảm dẫn dắt nhiều người về cùng một ngọn lửa.",
      "reversed": "Cố chấp chỉ nghe lời xu nịnh, hoặc tầm nhìn vượt xa cả tập thể lẫn thời cuộc. Dùng uy quyền để kiểm soát sẽ đánh mất lòng trung thành."
    },
    "advice": {
      "upright": "Nói rõ tầm nhìn và giao việc — hãy lãnh đạo, đừng tự hi sinh trong từng chi tiết.",
      "reversed": "Lắng nghe ý kiến trái chiều và điều chỉnh chiến lược. Quyền lực đòi hỏi sự tự giới hạn."
    },
    "categories": {
      "love": {
        "upright": "Người bạn đời trưởng thành mang lại định hướng và sự che chở — giai đoạn cam kết rất thuận.",
        "reversed": "Áp đặt hoặc xa cách về cảm xúc — đừng đối xử với người yêu như cấp dưới."
      },
      "career": {
        "upright": "Khởi nghiệp, quản lý, chiến lược — hãy mở rộng ảnh hưởng với kiểm soát rủi ro hợp lý.",
        "reversed": "Quyết định sai hoặc tập thể rời hướng — hãy dựng lại niềm tin và sự minh bạch."
      },
      "wealth": {
        "upright": "Đầu tư lớn, sáp nhập, mở rộng đều khả thi nếu quản trị rủi ro tốt.",
        "reversed": "Vươn quá tầm hoặc bảo lãnh cho người khác đe dọa tài sản cốt lõi — hãy làm rõ bằng hợp đồng."
      },
      "health": {
        "upright": "Nhìn chung ổn định — hãy để ý tim mạch và căng thẳng; khám định kỳ.",
        "reversed": "Áp lực cao mạn tính, mất ngủ, thể chất thiên hỏa — bắt buộc phải nghỉ ngơi và giao bớt việc."
      }
    }
  },
  {
    "id": "cups_ace",
    "numericId": 36,
    "name": "Cốc Át",
    "nameEn": "Cups Ace",
    "type": "minor",
    "suit": "cups",
    "number": 1,
    "meaning": {
      "upright": "Cảm xúc được sinh ra mới, trực giác khai mở, nuôi dưỡng tâm hồn, mùa xuân của tình yêu",
      "reversed": "Trái tim khép lại, trực giác mờ nhạt, cảm xúc bị chặn, khô hạn nội tâm"
    },
    "description": "Lá Át Cốc rót dòng nước đầu tiên từ đám mây xuống bàn tay — nguồn cội của cảm xúc và trực giác. Ở chiều xuôi, chiếc cốc nội tâm tràn đầy; một cảm xúc mới đang lặng lẽ khơi lên.",
    "interpretation": {
      "upright": "Một khởi đầu mới trong cảm xúc, cảm hứng hoặc trải nghiệm tâm linh. Bạn dễ dàng cảm nhận được nhu cầu thật của mình và của người khác hơn — hãy mở lòng đón nhận tình yêu và cái đẹp.",
      "reversed": "Cảm xúc bị chặn lại, hoặc đã lâu không còn cảm nhận được sự kết nối. Vết thương cũ có thể đã đóng sập cánh cửa — hãy bắt đầu bằng cuộc đối thoại dịu dàng với chính mình."
    },
    "advice": {
      "upright": "Hãy để mình được xúc động và được quan tâm. Đáp lại bằng tình cảm chân thành.",
      "reversed": "Bắt đầu từ lòng tự thương. Dựng lại niềm tin vào con người và cuộc đời bằng những bước nhỏ."
    },
    "categories": {
      "love": {
        "upright": "Tình yêu mới, cơ hội hàn gắn, hoặc một trao đổi cảm xúc sâu sắc hơn — lời bày tỏ chân thành có thể thành công.",
        "reversed": "Sự lạnh nhạt, những bức tường, hay vết thương chưa lành — ép buộc một mối quan hệ mới không phù hợp lúc này."
      },
      "career": {
        "upright": "Công việc sáng tạo, chữa lành hay phụng sự tuôn chảy cùng cảm hứng; không khí tập thể ấm áp.",
        "reversed": "Đam mê với công việc phai nhạt hoặc sức sáng tạo cạn khô — hãy tìm lại ý nghĩa và nguồn cội."
      },
      "wealth": {
        "upright": "Uy tín và thiện chí mang lại cơ hội — hợp tác chân thành tốt hơn đầu cơ.",
        "reversed": "Quyết định tiền bạc theo cảm xúc — hãy để cảm xúc lắng xuống rồi mới quyết."
      },
      "health": {
        "upright": "Uống đủ nước và giữ cân bằng cảm xúc rất hữu ích; tắm thư giãn và thiền đều thích hợp.",
        "reversed": "Cảm xúc bị dồn nén ảnh hưởng đến giấc ngủ và tiêu hóa — hãy trò chuyện hoặc tìm sự hỗ trợ."
      }
    }
  },
  {
    "id": "cups_two",
    "numericId": 37,
    "name": "Cốc Hai",
    "nameEn": "Cups Two",
    "type": "minor",
    "suit": "cups",
    "number": 2,
    "meaning": {
      "upright": "Tình cảm đôi bên, bạn đồng hành bình đẳng, sức hút tâm hồn, chén giao ước",
      "reversed": "Mất cân bằng, hòa hợp rỗng, sức hút phai nhạt, lời hứa lung lay"
    },
    "description": "Lá Hai Cốc vẽ hai nhân vật cùng nâng cốc — dòng nước mang hình hài của sự trao đổi cảm xúc bình đẳng. Ở chiều xuôi, lá bài đánh dấu sự lựa chọn và tôn trọng lẫn nhau trong một mối quan hệ đối tác.",
    "interpretation": {
      "upright": "Mối gắn kết được dựng trên sức hút và sự bình đẳng — tình yêu, tình bạn hay đối tác kinh doanh ăn nhịp và biết nể trọng nhau. Đây là thời điểm tốt để chính thức hóa hoặc làm sâu đậm thêm cam kết.",
      "reversed": "Một bên cho đi quá nhiều hoặc lời nói không chạm được nhau — có vết nứt dưới bề mặt lễ độ. Quan điểm có thể đã rẽ đôi; hãy tự hỏi liệu hai người còn cùng tần số không."
    },
    "advice": {
      "upright": "Hãy trân trọng sự chủ động đến từ cả hai phía. Bình đẳng và lắng nghe giữ con đường ổn định.",
      "reversed": "Nói thẳng nhu cầu và ranh giới của mình. Sự mất cân bằng cần được điều chỉnh, không phải phủ nhận."
    },
    "categories": {
      "love": {
        "upright": "Đôi lứa ngọt ngào và bình đẳng — đính hôn, kết hôn hay xác định rõ mối quan hệ đều thuận.",
        "reversed": "Nguội lạnh, lòng trung thành bị chia — hãy xác nhận liệu hai người còn bước cùng đường."
      },
      "career": {
        "upright": "Hợp tác và các giao dịch trực tiếp diễn ra thuận lợi — niềm tin chính là vốn liếng.",
        "reversed": "Điều khoản bất công hoặc niềm tin bị phá vỡ — hãy làm rõ chi tiết hợp đồng."
      },
      "wealth": {
        "upright": "Tài chính chung hoặc liên doanh vận hành tốt nếu thống nhất cách chia ngay từ đầu.",
        "reversed": "Đối tác che giấu hoặc kéo bạn xuống — hãy cắt lỗ và giữ lại bằng chứng."
      },
      "health": {
        "upright": "Bạn bè hoặc người bạn đời hỗ trợ quá trình hồi phục — đi bộ hay vận động cùng nhau đều tốt.",
        "reversed": "Căng thẳng trong quan hệ ảnh hưởng đến cơ thể — hãy rời khỏi môi trường hao năng lượng nếu cần."
      }
    }
  },
  {
    "id": "cups_three",
    "numericId": 38,
    "name": "Cốc Ba",
    "nameEn": "Cups Three",
    "type": "minor",
    "suit": "cups",
    "number": 3,
    "meaning": {
      "upright": "Ăn mừng, tình bạn, niềm vui chia sẻ, mùa thu hoạch cảm xúc",
      "reversed": "Thái quá, thị phi, chuyện tay ba, trống rỗng sau những ồn ào"
    },
    "description": "Lá Ba Cốc là ba người phụ nữ cùng nâng cốc — dòng nước đã ấm lên thành cộng đồng và tình bạn. Ở chiều xuôi, hãy chia sẻ thành công và tiếng cười với người khác.",
    "interpretation": {
      "upright": "Những cuộc quây quần, tiệc tùng và vòng tròn bạn bè mang lại niềm vui thực sự. Mạng lưới nâng đỡ đang hoạt động tích cực — xây dựng tập thể, mở tiệc, nâng ly. Cảm xúc được nhân lên dưới ánh sáng sẻ chia.",
      "reversed": "Dư âm mệt nhoài sau cuộc vui, tin đồn, hoặc chuyện tay ba làm xói mòn niềm tin. Bữa tiệc có thể đang che giấu vấn đề — hãy phân biệt mối gắn kết thật với tiếng ồn bề mặt."
    },
    "advice": {
      "upright": "Hãy ăn mừng cùng những người bạn thật lòng. Cảm ơn những ai đã đồng hành cùng bạn.",
      "reversed": "Cắt bỏ những mối giao du rỗng tuếch. Giữ năng lượng cho những đồng minh chân chính."
    },
    "categories": {
      "love": {
        "upright": "Người độc thân có thể gặp gỡ tại một buổi tụ họp; các cặp đôi hưởng lợi từ những buổi hẹn chung với bạn bè.",
        "reversed": "Người thứ ba hoặc một người bạn quá thân thiết — hãy vạch rõ ranh giới."
      },
      "career": {
        "upright": "Tinh thần đồng đội vững mạnh — giao lưu trong ngành giúp mở rộng mạng lưới.",
        "reversed": "Thị phi công sở hoặc bè phái — hãy giữ tập trung và tránh chọn phe."
      },
      "wealth": {
        "upright": "Mua chung, gọi vốn cộng đồng hoặc giới thiệu khách hàng mang lại lợi ích thiết thực.",
        "reversed": "Chi tiêu vì nể nang và các bữa tiệc làm hao tiền — hãy đặt mức trần cho ngân sách giao tế."
      },
      "health": {
        "upright": "Niềm vui nâng cao sức đề kháng — giao tiếp xã hội điều độ tốt cho tinh thần.",
        "reversed": "Rượu bia nhiều và tiệc khuya hại gan và giấc ngủ — hãy hồi phục sau đó."
      }
    }
  },
  {
    "id": "cups_four",
    "numericId": 39,
    "name": "Cốc Bốn",
    "nameEn": "Cups Four",
    "type": "minor",
    "suit": "cups",
    "number": 4,
    "meaning": {
      "upright": "Quay vào bên trong, mệt mỏi cảm xúc, đánh giá lại, khoảng dừng quan sát",
      "reversed": "Bước ra khỏi vỏ bọc, nắm lấy cơ hội, từ chối sự trì trệ, đam mê trở lại"
    },
    "description": "Lá Bốn Cốc vẽ một người làm ngơ ba chiếc cốc được dâng tới — dòng nước quay vào trong thành sự đủ đầy và khoảng lặng. Ở chiều xuôi, sự đình trệ cảm xúc đang đặt câu hỏi bạn thật sự muốn điều gì.",
    "interpretation": {
      "upright": "Cảm giác bất mãn hoặc nhàm chán với hiện tại — không phải vì thiếu lựa chọn, mà vì mắt bạn chưa nhìn vào điều đang được dâng tới. Sự tĩnh lặng và chiêm nghiệm sẽ làm rõ điều bạn khao khát.",
      "reversed": "Sự tê liệt dần tan; một lời mời hay cơ hội mới xuất hiện. Chiếc cốc thứ tư đang chờ — bạn có với tay tới không?"
    },
    "advice": {
      "upright": "Tạm ngưng than vãn. Hãy liệt kê những điểm tựa và lựa chọn mình đang có trước khi thay đổi điều gì.",
      "reversed": "Khi cơ hội gõ cửa, đừng từ chối theo quán tính — hãy nói lời đồng ý với một khởi đầu nhỏ."
    },
    "categories": {
      "love": {
        "upright": "Cảm giác phẳng lặng với tình yêu hoặc với người đang theo đuổi — hãy phân biệt sự trầm lắng tạm thời với sự lệch nhau thật sự.",
        "reversed": "Chấm dứt cuộc chiến tranh lạnh hoặc lối mòn độc thân — ai đó có thể xứng đáng được một cơ hội nữa."
      },
      "career": {
        "upright": "Giai đoạn chững lại phù hợp để học hỏi và chiêm nghiệm — không phải để nhảy việc mù quáng.",
        "reversed": "Vị trí mới hoặc một vai trò nội bộ xuất hiện — đừng để quán tính khiến bạn bỏ lỡ."
      },
      "wealth": {
        "upright": "Thu nhập chưa làm bạn hài lòng nhưng chưa có bước chuyển nào — hãy rà soát kỹ năng và khoản tiết kiệm trước.",
        "reversed": "Nguồn thu phụ hoặc kênh mới đáng để thử — sự \"đủ\" không nhất thiết là mức trần."
      },
      "health": {
        "upright": "Tâm trạng hoặc động lực xuống thấp — nếp sinh hoạt đều đặn và vận động nhẹ sẽ giúp ích.",
        "reversed": "Năng lượng trở lại — một liệu pháp hoặc bộ môn thể dục mới có thể phù hợp."
      }
    }
  },
  {
    "id": "cups_five",
    "numericId": 40,
    "name": "Cốc Năm",
    "nameEn": "Cups Five",
    "type": "minor",
    "suit": "cups",
    "number": 5,
    "meaning": {
      "upright": "Mất mát và tiếc nuối, nỗi buồn đang chiếm trọn, thất vọng cảm xúc, cốc đổ tràn",
      "reversed": "Nhìn thấy điều còn lại, tha thứ, nỗi buồn lắng dịu, hy vọng trở về"
    },
    "description": "Lá Năm Cốc vẽ nhân vật khoác áo choàng nhìn ba chiếc cốc đã đổ — dòng nước mang hình hài của nỗi buồn. Đau thương là thật; nhưng hai chiếc cốc vẫn còn đứng vững phía sau lưng.",
    "interpretation": {
      "upright": "Mất mát, chia lìa hay thất bại gây đau đớn — bạn dán mắt vào những gì đã mất. Việc thương tiếc là chính đáng; nhưng đừng quên những điểm tựa và khả năng vẫn còn ở phía sau.",
      "reversed": "Đầu bạn ngẩng lên sau cú đánh; những mối gắn kết và con đường còn lại đã hiện ra. Đây là lúc tha thứ và bước tiếp với bài học trong tay."
    },
    "advice": {
      "upright": "Hãy cho phép mình rơi lệ và thương tiếc. Để ý xem ai và điều gì vẫn đang đứng cùng bạn.",
      "reversed": "Hãy quay về phía hai chiếc cốc còn đầy — lòng biết ơn và hành động sẽ dựng lại cuộc đời."
    },
    "categories": {
      "love": {
        "upright": "Chia tay, phản bội hoặc thất vọng sâu sắc — hãy chữa lành trước khi bắt đầu điều mới.",
        "reversed": "Trái tim đang lành lại — cơ hội tái hợp hoặc tình yêu mới có thể mở ra khi cánh cửa hé."
      },
      "career": {
        "upright": "Dự án thất bại hoặc bị sa thải gây tổn thương — tâm trạng xuống thấp là phản ứng rất người.",
        "reversed": "Bài học đã được rút ra; cơ hội mới đang nhen nhóm từ tro tàn."
      },
      "wealth": {
        "upright": "Thua lỗ hoặc phát sinh chi phí bất ngờ — hãy cầm máu trước khi gỡ gạc trong tức giận.",
        "reversed": "Tài chính dần ổn định — những khoản tiết kiệm nhỏ dựng lại niềm tin."
      },
      "health": {
        "upright": "Nỗi buồn ảnh hưởng đến ăn uống và giấc ngủ — hãy dựa vào người khác hoặc tìm trợ giúp chuyên môn.",
        "reversed": "Cơ thể và tâm trạng đang hồi phục — thời gian giao tiếp nhẹ nhàng và ra ngoài trời sẽ giúp ích."
      }
    }
  },
  {
    "id": "cups_six",
    "numericId": 41,
    "name": "Cốc Sáu",
    "nameEn": "Cups Six",
    "type": "minor",
    "suit": "cups",
    "number": 6,
    "meaning": {
      "upright": "Nỗi nhớ, ký ức tuổi thơ, người bạn cũ trở về, vẻ đẹp giản dị",
      "reversed": "Mắc kẹt trong quá khứ, từ chối trưởng thành, lý tưởng hóa mối tình cũ, trốn tránh hiện tại"
    },
    "description": "Lá Sáu Cốc vẽ những đứa trẻ trao nhau những chiếc cốc cắm hoa — dòng nước mang hình hài của ký ức trong trẻo và lòng tốt. Ở chiều xuôi, lá bài mang đến dư âm của những mối dây cũ và một món quà giản dị.",
    "interpretation": {
      "upright": "Tuổi thơ, quê nhà, người bạn cũ hoặc mối tình đầu trở lại trong tâm trí — một cuộc hội ngộ ấm áp hay một món quà có thể đến. Hãy nối lại với cội nguồn; sức mạnh của quá khứ nuôi dưỡng hiện tại.",
      "reversed": "Quá khứ bị lý tưởng hóa, vết thương cũ hay mối tình cũ đang giam giữ bạn, ký ức che lấp bổn phận của người trưởng thành. Hãy phân biệt nỗi nhớ lành mạnh với nhà tù của ngày hôm qua."
    },
    "advice": {
      "upright": "Hãy gọi cho một người bạn cũ hoặc ghé lại một nơi chốn ý nghĩa — để hơi ấm ấy nuôi dưỡng ngày hôm nay.",
      "reversed": "Trân trọng ký ức nhưng dồn năng lượng chính cho mối gắn kết và mục tiêu ở hiện tại."
    },
    "categories": {
      "love": {
        "upright": "Người yêu cũ trở lại, mối dây thuở nhỏ bùng lên, hoặc gia đình giới thiệu một người đã quen biết.",
        "reversed": "Bám víu vào người cũ hoặc so sánh bạn đời với quá khứ sẽ chặn đứng tình yêu mới."
      },
      "career": {
        "upright": "Đồng nghiệp, nơi làm cũ hoặc mạng lưới từ thời đi học có thể giúp ích; dự án mang hơi hướng hoài cổ rất hợp.",
        "reversed": "Từ chối công cụ mới, luôn cho rằng \"ngày xưa tốt hơn\" — hãy cập nhật kỹ năng."
      },
      "wealth": {
        "upright": "Quà tặng từ gia đình, thừa kế hoặc việc bán đồ cũ mang lại niềm vui bất ngờ.",
        "reversed": "Chi tiêu vì hoài niệm hoặc đầu tư theo cảm tính — hãy giữ sự lý trí."
      },
      "health": {
        "upright": "Ký ức ấm áp giúp chữa lành — thời gian bên người lớn tuổi mang lại sự an yên.",
        "reversed": "Xem phim liên tục để trốn tránh làm rối loạn nhịp sinh hoạt — hãy lập lại lịch trình."
      }
    }
  },
  {
    "id": "cups_seven",
    "numericId": 42,
    "name": "Cốc Bảy",
    "nameEn": "Cups Seven",
    "type": "minor",
    "suit": "cups",
    "number": 7,
    "meaning": {
      "upright": "Nhiều lựa chọn, ảo tưởng sống động, dục vọng trồi lên, con đường của ảo ảnh",
      "reversed": "Mục tiêu rõ ràng, lựa chọn có nền tảng, rời bỏ mộng tưởng, tập trung vào một hướng"
    },
    "description": "Lá Bảy Cốc để bảy viễn cảnh lơ lửng trong mây — nước là trí tưởng tượng và cám dỗ. Ở chiều xuôi, muôn vàn lựa chọn làm lóa mắt; điều cần là phân biệt khát vọng thật với ảo ảnh.",
    "interpretation": {
      "upright": "Ước mơ, cám dỗ và khả năng ùn ùn kéo vào tâm trí — đây là đỉnh cao của sáng tạo, nhưng chỉ riêng tưởng tượng thì chẳng dựng nên điều gì.",
      "reversed": "Sương mù tan dần; một hai hướng đi thật sự được chọn. Hành động thay thế cho những chuỗi ngày tưởng tượng miên man."
    },
    "advice": {
      "upright": "Viết ra bảy lựa chọn, rồi lọc lại còn hai ba bằng tiêu chí thực tế.",
      "reversed": "Cắt bỏ những nhánh phụ. Hãy làm cho trọn con đường đã chọn — đừng tạo thêm ảo tưởng mới để trốn tránh công việc."
    },
    "categories": {
      "love": {
        "upright": "Người theo đuổi hoặc những lý tưởng nhiều hơn hẳn đời thực — hãy tìm cho ra trái tim chân thành.",
        "reversed": "Chọn một người hoặc dứt khoát từ chối những mối không hợp — chấm dứt thế ngồi trên hàng rào."
      },
      "career": {
        "upright": "Nhiều hướng đi mới chỉ nằm trong tưởng tượng — hãy khảo sát tính khả thi trước khi chọn đường chính.",
        "reversed": "Tập trung vào công việc chính hoặc một dự án phụ — phân tán chính là kẻ thù."
      },
      "wealth": {
        "upright": "Những huyền thoại đầu tư đang làm bạn xiêu lòng — hiểu rõ rồi hãy xuống tiền; đừng tham mà vơ hết.",
        "reversed": "Đơn giản hóa tài sản và chi tiêu; hãy thực thi đúng ngân sách bạn đã lập."
      },
      "health": {
        "upright": "Các trào lưu dưỡng sinh và thần dược dễ hút mắt — hãy hỏi chuyên gia trước đã.",
        "reversed": "Chọn một thói quen bền vững rồi giữ nó."
      }
    }
  },
  {
    "id": "cups_eight",
    "numericId": 43,
    "name": "Cốc Tám",
    "nameEn": "Cups Eight",
    "type": "minor",
    "suit": "cups",
    "number": 8,
    "meaning": {
      "upright": "Rời bỏ, tìm kiếm chiều sâu, từ giã sự nông cạn, hành trình tâm linh",
      "reversed": "Do dự, sợ cam kết, giậm chân tại chỗ, chưa dám rời đi"
    },
    "description": "Lá Tám Cốc vẽ một người rời bỏ tám chiếc cốc xếp lại dưới ánh trăng — nước đã hóa thành sự ra đi để tìm ý nghĩa sâu hơn. Chiều xuôi là từ giã những gì không còn nuôi dưỡng tâm hồn.",
    "interpretation": {
      "upright": "Bề ngoài vẫn vững vàng nhưng bên trong đã hiểu ra — bạn cần rời khỏi một người, một công việc hay một lối sống để về đúng với mình hơn. Ra đi cần can đảm, và đó vẫn là trưởng thành.",
      "reversed": "Bạn biết phải đi mà vẫn ở lại vì sợ, hoặc dao động qua lại đến kiệt sức. Vùng an toàn khi ấy ngốn của bạn nhiều hơn là cứu bạn."
    },
    "advice": {
      "upright": "Gọi tên điều đang thiếu. Lên kế hoạch cho bước kế tiếp, rồi ra đi trong sự tôn trọng.",
      "reversed": "Liệt kê cái giá của việc ở lại so với ra đi. Đặt một ngày quyết định — chấm dứt chuỗi trì hoãn không hồi kết."
    },
    "categories": {
      "love": {
        "upright": "Kết thúc mối quan hệ không còn nuôi dưỡng bạn, hoặc tạm dừng để nhận ra điều mình thật sự cần.",
        "reversed": "Ở lại trong tổn thương vì sợ cô đơn — hãy rời đi khi đã sẵn sàng, cùng một kế hoạch cụ thể."
      },
      "career": {
        "upright": "Nghỉ việc để học tiếp, đổi ngành hoặc tạm dừng vì ý nghĩa sống — nhìn dài hạn thì có lợi.",
        "reversed": "Chán ghét vị trí hiện tại nhưng sợ thay đổi — hãy chắc chắn bước kế tiếp trước khi chính thức rời đi."
      },
      "wealth": {
        "upright": "Dứt khỏi một khoản lỗ không đáy; chuyển sang phân bổ bền vững.",
        "reversed": "Nỗi sợ khiến bạn giữ lại khoản đầu tư tồi — hãy tìm ý kiến thứ hai từ chuyên gia."
      },
      "health": {
        "upright": "Thay đổi liệu pháp hay môi trường sai lệch; tìm sự hòa hợp sâu hơn.",
        "reversed": "Tránh né việc khám bệnh hay đổi thói quen — vấn đề sẽ cứ thế chồng chất."
      }
    }
  },
  {
    "id": "cups_nine",
    "numericId": 44,
    "name": "Cốc Chín",
    "nameEn": "Cups Nine",
    "type": "minor",
    "suit": "cups",
    "number": 9,
    "meaning": {
      "upright": "Điều ước thành hiện thực, trọn vẹn cảm xúc, niềm vui mãn nguyện, giấc mơ thành sự thật",
      "reversed": "Chưa bao giờ thấy đủ, thành công trống rỗng, điều ước méo mó, thiếu hụt bên trong"
    },
    "description": "Lá Chín Cốc vẽ một người mãn nguyện với những chiếc cốc xếp phía sau — đây là \"lá bài điều ước\". Nước là sự thỏa lòng và khát vọng đã được ban. Chiều xuôi khuyên bạn hãy tận hưởng điều đã đến.",
    "interpretation": {
      "upright": "Điều ước có xu hướng thành hiện thực, nhất là trong tình yêu và những lạc thú. Bạn thấy đủ đầy và được ưu ái — lòng biết ơn và một chút ăn mừng vừa phải rất hợp lúc này.",
      "reversed": "Đạt được điều muốn mà lòng vẫn trống, hoặc thành công xây trên phù hoa và so đo. Ham muốn cứ lớn dần — bạn quên mất vì sao ban đầu mình lại cầu xin điều đó."
    },
    "advice": {
      "upright": "Tận hưởng những gì mình đang có. Chia sẻ niềm vui với những người thật sự quan trọng.",
      "reversed": "Tự hỏi thế nào là \"đủ\" — quay từ cuộc rượt đuổi bên ngoài vào bên trong."
    },
    "categories": {
      "love": {
        "upright": "Chuyện tình ngọt ngào, lời cầu hôn thành công, hoặc người độc thân tự tin thu hút được người tốt.",
        "reversed": "Bề mặt hoàn hảo mà lõi rỗng — hoặc vì kén chọn mà bạn đánh mất hạnh phúc đang có."
      },
      "career": {
        "upright": "Mục tiêu đạt được, đánh giá xuất sắc — đỉnh cao của sự thỏa mãn cá nhân.",
        "reversed": "Chức danh để phô trương trong khi đã kiệt sức — thành tích đang che lấp sự mệt mỏi."
      },
      "wealth": {
        "upright": "Thu nhập đủ làm bạn hài lòng; hãy sống chất lượng và để dành thay vì chạy theo phô trương.",
        "reversed": "Tiêu dùng theo phong trào hoặc cờ bạc sẽ làm giảm sự mãn nguyện thật."
      },
      "health": {
        "upright": "Cơ thể và tâm trạng dễ chịu — ăn uống và giấc ngủ đang cân bằng tốt.",
        "reversed": "Lạc thú quá độ, hoặc bỏ khám sức khỏe vì nghĩ rằng mình \"thấy ổn\"."
      }
    }
  },
  {
    "id": "cups_ten",
    "numericId": 45,
    "name": "Cốc Mười",
    "nameEn": "Cups Ten",
    "type": "minor",
    "suit": "cups",
    "number": 10,
    "meaning": {
      "upright": "Trọn vẹn cảm xúc, gia đình hòa thuận, tổ ấm hạnh phúc, mười chiếc cốc thẳng hàng",
      "reversed": "Rạn nứt gia đình, lý tưởng bị thổi phồng, hòa bình bề mặt, lệch nhau về giá trị"
    },
    "description": "Lá Mười Cốc là cầu vồng trên mái nhà — nước đã đạt đến sự trọn vẹn cảm xúc. Chiều xuôi đưa tình yêu, tổ ấm và giá trị bên trong về cùng một hướng — cái kết dịu dàng của con đường Cốc.",
    "interpretation": {
      "upright": "Đời sống cảm xúc đang tiến gần sự toàn vẹn — bạn đời, gia đình và chính bạn đồng điệu với nhau. Hôn nhân, con cái, nhà cửa hay cảm giác thuộc về đều được ưu ái.",
      "reversed": "Xung đột gia đình, khoảng cách giữa hình mẫu lý tưởng và thực tế, hoặc sự hòa hợp giả tạo che đi nhu cầu thật. Hãy tự hỏi các giá trị cốt lõi của hai người còn khớp nhau không."
    },
    "advice": {
      "upright": "Đầu tư thời gian và tình yêu cho những người thân thiết nhất — xây dựng hạnh phúc lâu bền.",
      "reversed": "Gia đình cần sự thật hơn là bức tranh đẹp — hãy hàn gắn vết nứt trước khi sơn lại."
    },
    "categories": {
      "love": {
        "upright": "Hôn nhân hạnh phúc, kế hoạch gia đình — cam kết và cùng nhau gây dựng rất hợp lúc này.",
        "reversed": "Xung đột với gia đình hai bên, chuyện nuôi dạy con hoặc bất đồng giá trị — cần hòa giải hoặc đặt ra ranh giới."
      },
      "career": {
        "upright": "Cân bằng công việc và cuộc sống tốt — một công việc ổn định nuôi nấng tổ ấm là lựa chọn khôn ngoan.",
        "reversed": "Tăng ca làm tổn hại gia đình, hoặc lựa chọn nghề nghiệp đang chống lại kỳ vọng của người thân."
      },
      "wealth": {
        "upright": "Tài sản hộ gia đình tăng lên — lập kế hoạch bất động sản và quỹ giáo dục là phù hợp.",
        "reversed": "Cố giữ hình ảnh gia đình sang trọng khiến tiền và lòng người cùng căng thẳng."
      },
      "health": {
        "upright": "Sự nâng đỡ của gia đình giúp hồi phục — thời gian bên bạn đời và con cái chữa lành tinh thần.",
        "reversed": "Căng thẳng từ tổ ấm làm kiệt sức — trị liệu gia đình có thể sẽ giúp ích."
      }
    }
  },
  {
    "id": "cups_page",
    "numericId": 46,
    "name": "Cốc Tiểu Đồng",
    "nameEn": "Cups Page",
    "type": "minor",
    "suit": "cups",
    "meaning": {
      "upright": "Thông điệp cảm xúc, sứ giả của trực giác, tia sáng sáng tạo, thử thách dịu dàng",
      "reversed": "Cảm xúc thất thường, sáng tạo bế tắc, tin tức bị trì hoãn, quá nhạy cảm"
    },
    "description": "Lá Tiểu Đồng Cốc nghiêng mình nhìn chú cá trong chiếc cốc — thông điệp trực giác đầu tiên của nguyên tố nước. Chiều xuôi mang đến tin tức dịu dàng, một giấc mơ hay một thôi thúc nghệ thuật.",
    "interpretation": {
      "upright": "Một lá bài nhạy cảm và đầy chất thơ — lời tỏ tình, lời xin lỗi hoặc lời mời sáng tạo có thể tìm đến. Trực giác đang hoạt động; viết nhật ký, vẽ hay khám phá cảm xúc một cách nhẹ nhàng đều rất hợp.",
      "reversed": "Cảm xúc chao đảo, dễ tự ái, hoặc tin tốt bị hoãn lại. Sự bất an khiến bạn hiểu sai ý người khác; còn ý tưởng thì mãi nằm trong đầu."
    },
    "advice": {
      "upright": "Ghi lại những giấc mơ và cảm hứng. Hãy cởi mở với những cơ hội nhẹ nhàng.",
      "reversed": "Ổn định cảm xúc trước khi hồi âm — đừng lấy mọi lời nói làm chuyện của riêng mình."
    },
    "categories": {
      "love": {
        "upright": "Một mối tình thầm kín, một lá thư, hoặc lời tỏ tình trong sáng có thể xuất hiện.",
        "reversed": "Thử thách người kia bằng tâm trạng thất thường, biến mất không lời, hay nhầm lẫn sự tử tế thành tình yêu."
      },
      "career": {
        "upright": "Cơ hội thực tập, nghệ thuật hoặc tâm lý học mở ra; có người dìu dắt khích lệ bạn.",
        "reversed": "Dễ tự ái nơi công sở, bàn giao trễ — hãy dựng ranh giới cảm xúc chuyên nghiệp."
      },
      "wealth": {
        "upright": "Một khoản thu nhỏ từ sáng tạo, một món quà, hay bất ngờ từ phong bao đỏ.",
        "reversed": "Mua sắm để xoa dịu cảm xúc, hoặc sập bẫy khoản đầu tư được rót mật vào tai."
      },
      "health": {
        "upright": "Hội họa, âm nhạc, bơi lội làm dịu cả thân và tâm.",
        "reversed": "Lo âu, dị ứng hoặc rối loạn nội tiết — hãy lập lại nếp ngủ đều đặn trước tiên."
      }
    }
  },
  {
    "id": "cups_knight",
    "numericId": 47,
    "name": "Cốc Kỵ Sĩ",
    "nameEn": "Cups Knight",
    "type": "minor",
    "suit": "cups",
    "meaning": {
      "upright": "Theo đuổi tình cảm, lý tưởng hóa, nghe theo trái tim, lời mời đậm chất thơ",
      "reversed": "Lời hứa rỗng, thao túng cảm xúc, trốn tránh thực tại, bong bóng tình yêu"
    },
    "description": "Lá Kỵ Sĩ Cốc cưỡi ngựa với chiếc cốc nâng cao — nước là sự lãng mạn và lý tưởng. Chiều xuôi mang đến một cuộc theo đuổi, một lời cầu hôn, hoặc lời mời bước vào đời sống nghệ thuật.",
    "interpretation": {
      "upright": "Ai đó đến với bạn bằng thơ và sự quyến rũ, hoặc trái tim bạn đang gọi bạn về phía cái đẹp. Lời cầu hôn, một buổi hẹn, một hành trình nghệ thuật đều hợp lúc này — nhưng hãy để ý xem hành động có khớp với lời nói không.",
      "reversed": "Lời hứa nhiều hơn việc làm, hoặc chàng \"hoàng tử\" đang trốn tránh bổn phận. Một mối tình độc hại có thể ẩn sau lớp ảo tưởng — hãy đọc cho ra những dấu hiệu nguy hiểm."
    },
    "advice": {
      "upright": "Hãy tận hưởng sự lãng mạn nhưng quan sát hành vi nhất quán phía sau lời nói.",
      "reversed": "Tách thơ ca khỏi sự đáng tin — đừng đánh đổi một lựa chọn vững chắc lấy lời thề rỗng."
    },
    "categories": {
      "love": {
        "upright": "Một cuộc theo đuổi như chuyện cổ tích, một cuộc gặp gỡ xa cách, hay một người yêu nghệ sĩ hấp dẫn bạn.",
        "reversed": "Ngọt ngào rồi biến mất, hoặc chuyện tay ba — hãy dừng lỗ sớm."
      },
      "career": {
        "upright": "Cơ hội trong sáng tạo, truyền thông hay thiện nguyện mang màu sắc lý tưởng.",
        "reversed": "Một người sếp vẽ ra tương lai mà không ghi gì vào hợp đồng — hãy ký kết mọi thứ bằng giấy trắng mực đen."
      },
      "wealth": {
        "upright": "Chi tiêu cho cái đẹp hoặc thương hiệu ở mức vừa phải; canh bạc sáng tạo cần nhìn dài hạn.",
        "reversed": "Tiêu tiền cho một tương lai viển vông; cảnh giác với tiếp thị đánh vào cảm xúc và mô hình đa cấp."
      },
      "health": {
        "upright": "Tình yêu nâng đỡ tâm trạng — nhưng vẫn phải giữ giấc ngủ cho những buổi hẹn muộn.",
        "reversed": "Đau lòng làm xáo trộn ăn uống và nghỉ ngơi — hãy tìm chỗ dựa và dựng lên ranh giới."
      }
    }
  },
  {
    "id": "cups_queen",
    "numericId": 48,
    "name": "Cốc Nữ Hoàng",
    "nameEn": "Cups Queen",
    "type": "minor",
    "suit": "cups",
    "meaning": {
      "upright": "Lòng trắc ẩn, sự chăm sóc trực giác, sức mạnh dịu dàng, đồng cảm sâu sắc",
      "reversed": "Cảm xúc tràn bờ, hy sinh quá mức, trống rỗng bên trong, phụ thuộc"
    },
    "description": "Lá Nữ Hoàng Cốc ngồi trên ngai của nguyên tố nước — lòng nhân hậu đã chín muồi và sự điềm tĩnh của trực giác. Chiều xuôi cho thấy bạn là điểm tựa cho người khác; trực giác của bạn dịu dàng và chính xác.",
    "interpretation": {
      "upright": "Đồng cảm và trực giác ở mức cao — bạn lắng nghe, chữa lành, chăm sóc, nhưng hãy đối xử với chính mình cũng dịu dàng như thế. Chiều sâu sáng tạo và sự ổn định cảm xúc khiến bạn thành trung tâm bình yên của mọi mối quan hệ.",
      "reversed": "Hấp thụ tâm trạng của người khác đến cạn kiệt, hoặc hy sinh bản thân vì tình yêu. Khoảng trống bên trong được lấp bằng việc sửa sang chuyện của người khác — hãy xây lại lòng tự trọng và ranh giới."
    },
    "advice": {
      "upright": "Nâng đỡ người khác bằng sự khôn ngoan; mỗi ngày hãy rót đầy chiếc cốc của chính mình trước.",
      "reversed": "Đặt ra ranh giới cảm xúc. Hãy tự đầy đặn trước khi rót cho người khác."
    },
    "categories": {
      "love": {
        "upright": "Một người bạn đời chín chắn và dịu dàng, hoặc chính bạn đang vun đắp mối quan hệ — ổn định và tử tế.",
        "reversed": "Mô thức người tử vì đạo, hoặc bị giam cầm bằng cảm xúc — tình yêu phải chảy cả hai chiều."
      },
      "career": {
        "upright": "Tư vấn, giáo dục, chăm sóc, nghệ thuật đều tỏa sáng — trực giác dẫn đường cho lựa chọn.",
        "reversed": "Lao động cảm xúc quá tải — hãy học cách nói không và giao bớt việc."
      },
      "wealth": {
        "upright": "Thiện chí và sự tử tế mang lại người bảo trợ — nguồn thu lấy con người làm trung tâm sẽ bền.",
        "reversed": "Bao chi không giới hạn cho người thân và bạn bè — cần một ranh giới tài chính."
      },
      "health": {
        "upright": "Thiền, liệu pháp nước và nghệ thuật chữa lành rất mạnh.",
        "reversed": "Đồng cảm quá tải gây lo âu và mất ngủ — hãy ở một mình và nghỉ ngơi."
      }
    }
  },
  {
    "id": "cups_king",
    "numericId": 49,
    "name": "Cốc Vua",
    "nameEn": "Cups King",
    "type": "minor",
    "suit": "cups",
    "meaning": {
      "upright": "Cân bằng cảm xúc, ngoại giao chín chắn, lãnh đạo bằng lòng trắc ẩn, chiều sâu tĩnh lặng",
      "reversed": "Kìm nén cảm xúc, lạnh lùng rút lui, thao túng, vết nứt dưới lớp bình yên"
    },
    "description": "Lá Vua Cốc là nguyên tố nước đạt đến độ thuần thục — chiếc cốc vẫn vững vàng giữa bão tố. Chiều xuôi là lãnh đạo bằng sự đồng cảm điềm tĩnh và một trái tim biết chừng mực.",
    "interpretation": {
      "upright": "Sự chín chắn về cảm xúc giúp bạn hòa giải xung đột; lý trí và cảm xúc cùng bước trên con đường giữa. Bạn có thể là người cố vấn, trọng tài, hoặc người xử lý khéo léo những mối quan hệ phức tạp.",
      "reversed": "Bề mặt bình yên mà bên trong là núi lửa — hoặc sự trừng phạt lạnh lùng và thao túng bằng mặc cảm tội lỗi. Nghiện ngập hay sự không trung thực có thể nấp sau câu \"tôi lý trí mà\"."
    },
    "advice": {
      "upright": "Hãy quyết định bằng sự khôn ngoan cảm xúc vững vàng — trở thành người người khác tin cậy giữa sóng gió.",
      "reversed": "Thừa nhận cảm xúc thật của mình. Đừng dùng im lặng hay thao túng để nắm quyền kiểm soát."
    },
    "categories": {
      "love": {
        "upright": "Một bạn đời chín chắn và ổn định, hoặc một giai đoạn cam kết dài lâu đầy tôn trọng.",
        "reversed": "Chiến tranh lạnh, giữ lại tình cảm, hoặc những vấn đề bị che giấu cần một cuộc nói chuyện sâu."
      },
      "career": {
        "upright": "Quản lý, luật, ngoại giao, giám sát — sức mạnh mềm mỏng sẽ thắng thế.",
        "reversed": "Những màn kịch cảm xúc nơi công sở, hoặc kiệt sức được ngụy trang bằng câu \"mọi thứ ổn\"."
      },
      "wealth": {
        "upright": "Phân bổ hợp lý gắn với lương tâm xã hội — tăng trưởng bền và chậm.",
        "reversed": "Nợ che giấu, chi tiêu vì nghiện, hoặc bí mật tiền bạc trong gia đình phải được đưa ra ánh sáng."
      },
      "health": {
        "upright": "Khả năng quản lý cảm xúc tốt — bơi lội, thái cực quyền và các hoạt động cân bằng nguyên tố nước rất hữu ích.",
        "reversed": "Cảm xúc bị kìm nén dẫn tới cao huyết áp hoặc rượu bia — cần trị liệu và khám sức khỏe."
      }
    }
  },
  {
    "id": "swords_ace",
    "numericId": 50,
    "name": "Kiếm Át",
    "nameEn": "Swords Ace",
    "type": "minor",
    "suit": "swords",
    "number": 1,
    "meaning": {
      "upright": "Đầu óc sáng rõ, sự thật hiển lộ, tư duy đột phá, quyết định công bằng",
      "reversed": "Tâm trí mơ hồ, phán đoán sai, lời nói sắc bén, chần chừ chưa quyết"
    },
    "description": "Lá Át Kiếm là khoảnh khắc nguyên tố khí thức tỉnh — một lưỡi gươm xuyên qua màn sương, mang đến lưỡi sắc của tư duy và sự xuất hiện của chân lý.",
    "interpretation": {
      "upright": "Tâm trí bạn sáng rõ lạ thường. Bạn nhìn xuyên qua bề mặt để thấy cốt lõi — đây là thời điểm tốt cho một quyết định lớn và việc định hướng. Ý tưởng hay kế hoạch mới đã thành hình; hãy nói và làm với sự chính xác.",
      "reversed": "Tư tưởng rối ren, thông tin bị bóp méo, hoặc sự thật bị cảm xúc che khuất. Lời nói có thể cứa quá sâu; lựa chọn then chốt bị đình lại vì thiếu nhát cắt cuối cùng."
    },
    "advice": {
      "upright": "Viết ra kết luận khi đầu óc còn minh mẫn nhất. Nói dựa trên dữ kiện và logic — đừng pha loãng lưỡi sắc bằng tâm trạng.",
      "reversed": "Tạm dừng tranh luận. Sắp xếp thông tin và cảm xúc; nhìn toàn cảnh rồi hãy lên tiếng."
    },
    "categories": {
      "love": {
        "upright": "Nói thật lòng trong tình yêu — một cuộc trò chuyện rõ ràng sẽ hóa giải hiểu lầm.",
        "reversed": "Chiến tranh lạnh hoặc giọng điệu sắc bén gây tổn thương — hãy làm dịu giọng trước khi nói nội dung."
      },
      "career": {
        "upright": "Ký kết, bảo vệ quan điểm, đàm phán, khởi động dự án mới — logic và bằng chứng là vũ khí của bạn.",
        "reversed": "Kiểm tra hợp đồng và lời hứa hai lần — vội vàng sẽ ký vào những điều khoản bất lợi."
      },
      "wealth": {
        "upright": "Lựa chọn tài chính dựa trên phân tích — dữ liệu quan trọng hơn tin đồn.",
        "reversed": "Thông tin còn mờ mịt — hãy hoãn chi tiêu lớn; làm rõ sổ sách và mức rủi ro."
      },
      "health": {
        "upright": "Đầu óc minh mẫn — tốt cho việc khám sức khỏe và lập kế hoạch; thân và tâm cùng đi một nhịp.",
        "reversed": "Suy nghĩ quá nhiều lấy mất giấc ngủ — giảm tiếp nhận thông tin, cho não nghỉ ngơi thật sự."
      }
    }
  },
  {
    "id": "swords_two",
    "numericId": 51,
    "name": "Kiếm Hai",
    "nameEn": "Swords Two",
    "type": "minor",
    "suit": "swords",
    "number": 2,
    "meaning": {
      "upright": "Lựa chọn đau đớn, bế tắc, cân nhắc nội tâm, né tránh tạm thời",
      "reversed": "Thế bế tắc đang dịu lại, sự thật lộ diện, quyết định dứt khoát, thoát khỏi sương mù"
    },
    "description": "Lá Hai Kiếm vẽ một người bịt mắt với hai lưỡi gươm bắt chéo bên mép nước — thế cân bằng khó nhọc giữa cảm xúc và lý trí, khi tầm nhìn đầy đủ vẫn chưa được trao.",
    "interpretation": {
      "upright": "Bạn đang đối diện một lựa chọn mà mình không muốn nhìn thẳng — sự trì hoãn hay thế đứng trung lập đang che đi sức hút bên trong. Đừng vội, nhưng cũng đừng trốn mãi.",
      "reversed": "Sự đóng băng bắt đầu tan; những dữ kiện bị che giấu lộ ra; mặt lợi và mặt hại trở nên rõ ràng. Đã đến lúc bỏ băng bịt mắt, chọn, và nhận lấy hệ quả."
    },
    "advice": {
      "upright": "Liệt kê được và mất. Tâm sự với một người bạn tin cậy — đừng ôm trọn mớ rối ren một mình.",
      "reversed": "Thông tin đã đủ — càng trì hoãn càng hao tổn. Hãy chọn và bước đi, đừng đảo ngược quyết định mãi."
    },
    "categories": {
      "love": {
        "upright": "Tình cảm đang bế tắc — thêm thời gian có thể làm rõ cảm xúc thật.",
        "reversed": "Sự mập mờ chấm dứt — một lời nói thật sẽ đưa mối quan hệ sang giai đoạn mới."
      },
      "career": {
        "upright": "Hai con đường đều hợp lý — hãy tạm dừng việc nhảy việc hay ký kết cho tới khi những dữ kiện then chốt xuất hiện.",
        "reversed": "Giai đoạn quan sát đã hết — hãy đưa ra lựa chọn nghề nghiệp và hành động."
      },
      "wealth": {
        "upright": "Ngã rẽ tài chính — hãy quan sát trước khi đặt cược lớn; thử một khoản nhỏ là đủ.",
        "reversed": "Hướng đi đã rõ — hãy điều chỉnh phân bổ và chấm dứt sự dao động."
      },
      "health": {
        "upright": "Cơ thể lúc căng lúc mềm — giảm kích thích, giữ nhịp sinh hoạt đều.",
        "reversed": "Tìm được nhịp chăm sóc bền vững — sự cân bằng đang trở lại."
      }
    }
  },
  {
    "id": "swords_three",
    "numericId": 52,
    "name": "Kiếm Ba",
    "nameEn": "Swords Three",
    "type": "minor",
    "suit": "swords",
    "number": 3,
    "meaning": {
      "upright": "Đau lòng, chia ly buồn bã, lời nói gây thương tích, cú sốc cảm xúc",
      "reversed": "Bắt đầu chữa lành, buông bỏ quá khứ, tái sinh sau đau đớn, tha thứ cho chính mình"
    },
    "description": "Lá Ba Kiếm đâm xuyên trái tim dưới cơn mưa — lá bài nói thẳng về vết thương nhất trong bộ nguyên tố khí và nỗi buồn.",
    "interpretation": {
      "upright": "Một mất mát sâu sắc đang đến gần hoặc đã xảy ra — chia tay, phản bội, tin dữ, hay lời nói không thể rút lại. Nỗi đau là thật; hãy để mình khóc thay vì gượng gạo mặc lấy áo giáp.",
      "reversed": "Cơn đau nhói nhất đã qua. Bạn có thể nhìn lại mà không bị nhấn chìm. Tha thứ và buông bỏ thì khó, nhưng đó chính là con đường dẫn tới đời sống mới."
    },
    "advice": {
      "upright": "Hãy kể cho một người bạn hoặc viết ra cảm xúc — đừng niêm phong nỗi đau một mình. Thời gian dạy ta sống chung với nó, chứ không xóa nó đi.",
      "reversed": "Quay về phía chữa lành và tự chăm sóc. Câu chuyện cũ có thể được ghé thăm, nhưng đừng dọn vào ở trong đó."
    },
    "categories": {
      "love": {
        "upright": "Tình yêu bị tổn thương hoặc đã kết thúc — hãy cho trái tim khoảng không để thương tiếc.",
        "reversed": "Vẫn đang chữa lành, nhưng một cuộc đoàn tụ hoặc mối quan hệ mới có thể le lói."
      },
      "career": {
        "upright": "Công việc gặp trắc trở hoặc quan hệ bị sứt mẻ — hãy xử lý cảm xúc trước khi tính chiến lược.",
        "reversed": "Đã rút ra được bài học — sửa lại tinh thần rồi đi tiếp."
      },
      "wealth": {
        "upright": "Một mất mát bất ngờ khiến bạn bực bội — hãy chặn đà thất thoát, xem lại sổ sách; không mua thêm vì tâm trạng.",
        "reversed": "Vết thương tài chính đang lành — những bước nhỏ và đều sẽ dựng lại niềm tin."
      },
      "health": {
        "upright": "Nỗi buồn ảnh hưởng đến ăn uống và giấc ngủ — cần được dịu dàng hơn với bản thân.",
        "reversed": "Quá trình hồi phục đang diễn ra — vận động nhẹ và bầu bạn giúp bạn leo lên khỏi đáy."
      }
    }
  },
  {
    "id": "swords_four",
    "numericId": 53,
    "name": "Kiếm Bốn",
    "nameEn": "Swords Four",
    "type": "minor",
    "suit": "swords",
    "number": 4,
    "meaning": {
      "upright": "Nghỉ ngơi và lui về, thiền định, tạm rút lui, tích lũy sức lực",
      "reversed": "Tâm trí bồn chồn, bị buộc quay lại, chưa nghỉ đủ, tĩnh lặng để trốn tránh"
    },
    "description": "Lá Bốn Kiếm vẽ một người nằm nghỉ dưới ô cửa kính màu, thanh gươm đặt sang bên — rút khỏi trận chiến để hồi phục trong im lặng.",
    "interpretation": {
      "upright": "Hãy chậm lại. Bước ra khỏi xung đột và sự hối hả; cho thân và tâm một khoảng trống thật sự. Chiêm nghiệm và giấc ngủ không phải là lười biếng — chúng đang tích trữ lực cho chặng kế tiếp.",
      "reversed": "Sự nghỉ ngơi đích thực vẫn lảng tránh bạn, hoặc áp lực kéo bạn trở lại quá sớm — lo âu vẫn đang điều khiển. Cũng có thể \"nghỉ ngơi\" chỉ là lớp ngụy trang để trốn tránh bổn phận đang chờ."
    },
    "advice": {
      "upright": "Hãy lên lịch cho một giai đoạn hồi phục không bị ngắt quãng — một quãng ngắt kết nối ngắn sẽ làm con đường sáng rõ.",
      "reversed": "Tự hỏi xem thân thể cần nghỉ hay nỗi sợ đang cần nghỉ. Nếu là nỗi sợ, hãy từng bước trở lại với thực tế."
    },
    "categories": {
      "love": {
        "upright": "Khoảng cách và một quãng lắng dịu giúp hai người nhìn rõ nên ở lại hay chia xa.",
        "reversed": "Chiến tranh lạnh kéo quá dài — nói chuyện đúng lúc sẽ tránh được khoảng cách hóa đá."
      },
      "career": {
        "upright": "Xin nghỉ, xem lại dự án — hãy hoãn những khối lượng công việc mới áp lực cao.",
        "reversed": "Kỳ nghỉ đã hết — hãy trở lại nhịp làm việc từ từ, đừng làm tất cả cùng lúc."
      },
      "wealth": {
        "upright": "Giữ nguyên vị thế — giao dịch ít hơn, nắm giữ đều đặn.",
        "reversed": "Sự đình trệ đang tan — đánh giá lại khoản đầu tư mà không giao dịch để trả đũa."
      },
      "health": {
        "upright": "Cơ thể đang đòi nghỉ — hãy nghe theo bác sĩ, ngủ sớm, giảm căng thẳng tinh thần.",
        "reversed": "Nếu lên giường mà lòng vẫn không yên, hãy kiểm tra chứng lo âu; cần thì tìm trợ giúp."
      }
    }
  },
  {
    "id": "swords_five",
    "numericId": 54,
    "name": "Kiếm Năm",
    "nameEn": "Swords Five",
    "type": "minor",
    "suit": "swords",
    "number": 5,
    "meaning": {
      "upright": "Kết cục của xung đột, chiến thắng rỗng tuếch, tranh cãi, thắng mặt mũi mà mất lòng",
      "reversed": "Cơ hội hòa giải, buông bỏ cuộc chiến, bài học đã nhận, hàn gắn mối quan hệ"
    },
    "description": "Lá Năm Kiếm vẽ người thắng đang thu nhặt những lưỡi gươm trong khi những người khác bỏ đi — thắng một cuộc tranh luận chưa chắc đã thắng được sự bình yên.",
    "interpretation": {
      "upright": "Cuộc tranh chấp có thể kết thúc theo hướng có lợi cho bạn nhưng lại làm mất thiện chí và niềm tin. Hãy tự hỏi liệu chiến thắng này có xứng với cái giá phải trả.",
      "reversed": "Những cạnh sắc bắt đầu dịu lại; các bên có thể ngồi lại nói chuyện. Hãy học từ cuộc va chạm — sửa chữa thường tốt hơn là kéo dài chiến tranh."
    },
    "advice": {
      "upright": "Cân nhắc cái giá trước khi nói lời cuối. Khi lùi một bước là trời quang mây tạnh, đừng cần thêm nhát đánh quyết định.",
      "reversed": "Hãy chìa cành ô liu hoặc nói lời xin lỗi — hòa bình không phải là sự sỉ nhục."
    },
    "categories": {
      "love": {
        "upright": "Thắng trong cuộc cãi vã, mất đi sự gần gũi — lý lẽ có thể làm mất đi sự dịu dàng.",
        "reversed": "Cuộc chiến có thể nguôi ngoai — sửa chữa trung thực sẽ dựng lại niềm tin."
      },
      "career": {
        "upright": "Cuộc chiến nơi công sở có thể có lợi trước mắt nhưng hại danh tiếng — hãy luôn để một lối rút lui.",
        "reversed": "Rời khỏi thương vụ tồi; chiến lược mới tốt hơn mối hận cũ."
      },
      "wealth": {
        "upright": "Một cuộc cãi vã vì khoản lợi nhỏ có thể khiến bạn bỏ lỡ bức tranh lớn — đừng để lòng tự ái điều khiển tiền bạc.",
        "reversed": "Hãy thoát khỏi mối hợp tác thua lỗ; thích nghi thay vì đuổi theo món nợ cũ."
      },
      "health": {
        "upright": "Căng thẳng mạn tính đến từ xung đột — hãy giải tỏa cảm xúc ngay khi có thể.",
        "reversed": "Cơ thể đang thả lỏng sau cuộc chiến — hơi thở và những bài tập nhẹ nhàng sẽ giúp."
      }
    }
  },
  {
    "id": "swords_six",
    "numericId": 55,
    "name": "Kiếm Sáu",
    "nameEn": "Swords Six",
    "type": "minor",
    "suit": "swords",
    "number": 6,
    "meaning": {
      "upright": "Vượt sang vùng yên ả, rời khỏi nỗi đau, chuyển tiếp chậm rãi, hành trình chữa lành",
      "reversed": "Mắc kẹt tại chỗ, không thể buông, sợ thay đổi, lối đi bị chặn"
    },
    "description": "Lá Sáu Kiếm chở sáu lưỡi gươm hướng về bờ yên tĩnh hơn — chậm rãi rời khỏi nỗi đau để tới vùng nước dịu êm.",
    "interpretation": {
      "upright": "Bạn đang rời khỏi khó khăn; tiến trình có thể cảm giác đơn điệu nhưng hướng đi là về phía bình yên. Việc dịch chuyển, một môi trường mới, hoặc một cuộc \"ra đi\" nội tâm đều hỗ trợ chữa lành.",
      "reversed": "Bạn biết mình phải đi mà vẫn nán lại, hoặc vấp phải trở ngại giữa dòng — nỗi đau cũ kéo bạn ngược trở lại. Hãy gọi tên điều đang giữ cánh buồm của bạn."
    },
    "advice": {
      "upright": "Hãy chấp nhận giai đoạn chuyển tiếp có phần tẻ nhạt này. Cứ tiếp tục chèo — bờ yên ả xứng đáng với hành trình.",
      "reversed": "Tìm ra nỗi sợ hay sự cố chấp đang giữ bạn lại — một bước nhỏ vẫn tốt hơn là quay cuồng tại chỗ."
    },
    "categories": {
      "love": {
        "upright": "Rời khỏi mối tình cũ, hoặc kiên trì hàn gắn trong yêu xa — một giai đoạn dịu nhẹ.",
        "reversed": "Không thể buông người cũ hay sợ một mối quan hệ mới — hãy đối diện với sự ràng buộc và nỗi sợ."
      },
      "career": {
        "upright": "Chuyển công tác, nghỉ việc, bàn giao đều tiến triển — hãy hoàn tất quá trình chuyển tiếp trong kiên nhẫn.",
        "reversed": "Việc đổi việc bị đình lại hoặc nơi mới chưa hợp — hãy điều chỉnh kỳ vọng và nhịp độ."
      },
      "wealth": {
        "upright": "Tài chính cải thiện chậm — hãy giữ một nhịp cầu thận trọng, đừng vội mong phát tài.",
        "reversed": "Nợ nần hoặc dòng tiền mắc kẹt — hãy chủ động tìm giải pháp linh hoạt."
      },
      "health": {
        "upright": "Hồi phục đều đặn — hãy theo hướng dẫn để trở lại nhịp sống thường ngày.",
        "reversed": "Tái phát hoặc việc chăm sóc bị ngắt quãng — đừng hối thúc cơ thể vượt giới hạn."
      }
    }
  },
  {
    "id": "swords_seven",
    "numericId": 56,
    "name": "Kiếm Bảy",
    "nameEn": "Swords Seven",
    "type": "minor",
    "suit": "swords",
    "number": 7,
    "meaning": {
      "upright": "Chiến lược, hành động gián tiếp, thông tin chưa đầy đủ, lợi thế ngầm",
      "reversed": "Bị phơi bày, lương tâm cắn rứt, kế hoạch bị lộ, buộc phải trung thực"
    },
    "description": "Lá Bảy Kiếm vẽ một người lặng lẽ rời đi cùng những lưỡi gươm, còn ngoái nhìn lại — thủ pháp khéo léo và rủi ro đạo đức luôn song hành cùng nhau.",
    "interpretation": {
      "upright": "Cục diện phức tạp — bạn có thể hành động kín đáo, đi vòng qua chướng ngại, giữ kín quân bài của mình. Mưu lược không phải là điều xấu; hãy biết rõ ranh giới pháp lý và đạo đức.",
      "reversed": "Sự che giấu thất bại — lời nói dối hoặc lối tắt bị đưa ra ánh sáng. Hãy làm rõ hoặc sửa lại trước khi cái giá vượt xa phần thu được."
    },
    "advice": {
      "upright": "Lập kế hoạch trước khi hành động. Bảo vệ lợi ích cốt lõi — nhưng đừng biến sự dối trá thành thói quen.",
      "reversed": "Hãy làm rõ hiểu lầm và sửa lại đường đi sai — sự trung thực khó nghe sẽ ngăn hậu quả tệ hơn."
    },
    "categories": {
      "love": {
        "upright": "Có động cơ ẩn giấu hoặc phép thử trong mối quan hệ — hãy quan sát kỹ trước khi đầu tư sâu.",
        "reversed": "Điều bí mật lộ ra — cần sự thật để hàn gắn hoặc để quyết định."
      },
      "career": {
        "upright": "Ứng biến linh hoạt; hãy bảo vệ ý tưởng của mình — coi chừng rò rỉ thông tin.",
        "reversed": "Lối tắt hoặc hành vi vi phạm bị phát hiện — hãy dừng lại và quay về con đường trong sạch."
      },
      "wealth": {
        "upright": "Tài chính nên giữ kín đáo — cảnh giác với những kênh \"dễ ăn\" đáng ngờ.",
        "reversed": "Đầu cơ hoặc thu nhập vùng xám có thể mang họa — hãy hợp thức hóa sổ sách."
      },
      "health": {
        "upright": "Triệu chứng âm thầm cần được kiểm tra sớm — đừng cầu may bằng cách trì hoãn.",
        "reversed": "Nỗi lo bị chôn giấu đang trồi lên — hãy đối diện thay vì diễn vai khỏe mạnh."
      }
    }
  },
  {
    "id": "swords_eight",
    "numericId": 57,
    "name": "Kiếm Tám",
    "nameEn": "Swords Eight",
    "type": "minor",
    "suit": "swords",
    "number": 8,
    "meaning": {
      "upright": "Tự giam mình, giới hạn bởi nỗi sợ, tâm thế nạn nhân, tầm nhìn hẹp",
      "reversed": "Phá vỡ xiềng xích, tự trao quyền cho mình, sáng tỏ đột ngột, thoát khỏi cạm bẫy"
    },
    "description": "Lá Tám Kiếm trói một người lẽ ra có thể bước đi tự do — rất nhiều giới hạn được dệt nên từ nỗi sợ bên trong và một câu chuyện đã cố định.",
    "interpretation": {
      "upright": "Bạn cảm thấy bị mắc kẹt, nhưng những sợi dây thường do chính mình buộc. Bên ngoài không hoàn toàn bịt kín — bạn chỉ chưa cho phép mình nhìn thấy cánh cửa.",
      "reversed": "Sự thức tỉnh đang lay động — bạn cảm nhận được những ràng buộc có thể nới lỏng. Một bước chân là các nút thắt lỏng ra; chân trời mở rộng."
    },
    "advice": {
      "upright": "Liệt kê những chữ \"không thể\" và thử kiểm chứng từng điều — tách bức tường thật khỏi lồng giam do tưởng tượng. Chứng minh tự do bằng những hành động nhỏ.",
      "reversed": "Hãy hành động ngay khi thấy lối mở — đừng chờ điều kiện hoàn hảo mới cởi trói."
    },
    "categories": {
      "love": {
        "upright": "Sợ bị tổn thương nên chặn sự gần gũi, hoặc ở lại trong mối quan hệ không tử tế vì quán tính.",
        "reversed": "Can đảm lên tiếng hoặc ra đi có thể phá tan nhà tù cảm xúc."
      },
      "career": {
        "upright": "Có nhiều lựa chọn hơn nỗi sợ thừa nhận — điều thiếu thường là dũng khí hành động.",
        "reversed": "Cơ hội đột phá đã thấy rõ — hãy lên tiếng vì chính mình."
      },
      "wealth": {
        "upright": "Quá thận trọng khiến tăng trưởng đình trệ — một chút học hỏi mới mẻ có thể mở dòng chảy.",
        "reversed": "Cảnh túng tài chính vẫn có lối ra — thay đổi chiến lược sẽ cải thiện dòng tiền."
      },
      "health": {
        "upright": "Lo âu phóng đại triệu chứng — hãy kiểm tra cơ thể và chăm sóc tinh thần song song.",
        "reversed": "Cảm giác bị giới hạn dịu xuống — phục hồi chức năng và vận động sẽ cho thấy kết quả."
      }
    }
  },
  {
    "id": "swords_nine",
    "numericId": 58,
    "name": "Kiếm Chín",
    "nameEn": "Swords Nine",
    "type": "minor",
    "suit": "swords",
    "number": 9,
    "meaning": {
      "upright": "Lo lắng mất ngủ, suy nghĩ ám ảnh, mặc cảm tội lỗi, sức nặng của ác mộng",
      "reversed": "Nỗi sợ đang phai, đối diện con quỷ bên trong, cầu cứu, rời khỏi đêm tối"
    },
    "description": "Lá Chín Kiếm vẽ một người thức trắng trong đêm, chín lưỡi gươm treo trên tường — nỗi lo được phóng đại trong tiềm thức.",
    "interpretation": {
      "upright": "Những lo lắng tua đi tua lại trong đầu; nỗi sợ bị phóng đại; giấc ngủ và ăn uống đều bị ảnh hưởng. Nỗi khiếp sợ có thể vượt xa khả năng thật, nhưng đau khổ thì hoàn toàn có thật.",
      "reversed": "Giờ phút tăm tối nhất đang mỏng dần — bạn lên tiếng hoặc tìm trợ giúp; cơn ác mộng mất dần sức siết. Gọi tên nỗi sợ, và nó thu nhỏ lại."
    },
    "advice": {
      "upright": "Viết ra những lo lắng; hành động với điều mình kiểm soát được; buông điều mình không thể.",
      "reversed": "Đừng mang một mình — một người tin cậy hoặc chuyên gia sẽ giúp; rất nhiều nỗi sợ không trụ nổi trước ánh sáng ban ngày."
    },
    "categories": {
      "love": {
        "upright": "Ghen tuông, mặc cảm hoặc sự nghi ngờ đang giày vò mối quan hệ — hãy tách sự thật khỏi tưởng tượng.",
        "reversed": "Nút thắt lỏng dần — một cuộc nói chuyện thẳng thắn xóa đi nghi ngờ không cần thiết."
      },
      "career": {
        "upright": "Nỗi sợ bị đánh giá hay mất việc lấn át bạn — hãy tập trung vào những việc trong tầm kiểm soát.",
        "reversed": "Áp lực công việc dịu lại — sự tự tin và nhịp độ đang trở về."
      },
      "wealth": {
        "upright": "Hoảng loạn tiền bạc có thể vượt xa thực tế — hãy liệt kê tài sản và khoản nợ thật.",
        "reversed": "Lo âu tài chính giảm xuống — một kế hoạch lý trí mang lại sự vững vàng."
      },
      "health": {
        "upright": "Mất ngủ và tim đập nhanh gắn với căng thẳng — chăm sóc tinh thần là việc cấp bách.",
        "reversed": "Giấc ngủ và tâm trạng cải thiện — hãy tiếp tục nâng đỡ bản thân một cách dịu dàng."
      }
    }
  },
  {
    "id": "swords_ten",
    "numericId": 59,
    "name": "Kiếm Mười",
    "nameEn": "Swords Ten",
    "type": "minor",
    "suit": "swords",
    "number": 10,
    "meaning": {
      "upright": "Kết thúc đau đớn, chạm đáy, cú sốc phản bội, trật tự cũ sụp đổ",
      "reversed": "Sống sót sau vực sâu, bật lên từ đáy, buông bỏ quá khứ, bình minh đã gần"
    },
    "description": "Lá Mười Kiếm đâm xuyên tấm lưng dưới bầu trời vỡ — sự kết thúc trọn vẹn; sau độ sâu này, chỉ còn hướng đi lên.",
    "interpretation": {
      "upright": "Một mối quan hệ, công việc hay niềm tin đi đến hồi kết khắc nghiệt; cú đánh nặng nề như thể không còn mặt đất để đứng. Đây là đáy — và cũng là bước ngoặt, bởi điều tệ hơn có thể sẽ không đến nữa.",
      "reversed": "Mầm sống nhú lên từ đống đổ nát; bạn đứng dậy với lòng sẵn sàng rời quá khứ lại phía sau. Giờ khắc khó khăn nhất đã qua; tái thiết thì chậm nhưng hướng lên."
    },
    "advice": {
      "upright": "Hãy thừa nhận sự kết thúc. Cho phép mình sụp đổ trong chốc lát nếu cần; rồi nhặt lại từng mảnh — ngày mai có thể bắt đầu lại.",
      "reversed": "Hãy ghi nhận sức bền của chính bạn. Tái thiết bằng những mục tiêu nhỏ — đừng vội chứng minh điều gì."
    },
    "categories": {
      "love": {
        "upright": "Mối quan hệ tan vỡ hoặc sự phản bội cứa sâu — nhưng kết thúc cũng là giải thoát.",
        "reversed": "Đang trồi lên từ đống tro tàn — một tình yêu mới hoặc tình yêu với chính mình có thể nảy nở."
      },
      "career": {
        "upright": "Dự án thất bại, mất việc, hoặc danh tiếng bị tổn hại — hãy dừng lại, nghỉ ngơi, đừng liều gấp đôi trong tuyệt vọng.",
        "reversed": "Sự nghiệp chạm đáy — những công việc thầm lặng sẽ mở ra cơ hội kế tiếp."
      },
      "wealth": {
        "upright": "Có thể có mất mát lớn — hãy bảo vệ phần cốt lõi thay vì đuổi theo để gỡ lại tất cả.",
        "reversed": "Điều tệ nhất đã qua — hồi phục đều đặn tốt hơn một canh bạc điên rồ."
      },
      "health": {
        "upright": "Thân và tâm cạn kiệt — nghỉ ngơi nghiêm túc và điều trị là bắt buộc.",
        "reversed": "Con đường hồi phục đã mở — chăm sóc kiên nhẫn sẽ cho thấy tiến bộ dần dần."
      }
    }
  },
  {
    "id": "swords_page",
    "numericId": 60,
    "name": "Kiếm Tiểu Đồng",
    "nameEn": "Swords Page",
    "type": "minor",
    "suit": "swords",
    "number": 11,
    "meaning": {
      "upright": "Trí tò mò, con mắt tinh tường, ý tưởng mới, lời nói thẳng thắn",
      "reversed": "Lời lẽ bốc đồng, tin đồn, sự chú ý ngắn ngủi, kế hoạch rỗng"
    },
    "description": "Tiểu Đồng Kiếm đứng sẵn sàng trước gió với thanh kiếm nâng cao — luồng khí mới và một lưỡi gươm chưa được mài thật sắc.",
    "interpretation": {
      "upright": "Bạn rất nhạy bén với môi trường xung quanh; ý tưởng bùng lên — thuận cho học tập, nghiên cứu, những đề xuất mới. Sự thật thẳng thắn có thể chạm vào chỗ đau, nhưng nó phá vỡ im lặng.",
      "reversed": "Lời nói tuôn ra mà không qua bộ lọc; chuyện phiếm thay cho nội dung thật. Nói nhiều mà làm ít — hãy biến sự tò mò thành hành động bền bỉ."
    },
    "advice": {
      "upright": "Ghi lại ý tưởng và kiểm chứng dữ kiện — biến sự sắc sảo thành cái nhìn thấu đáo, chứ không phải nghi ngờ.",
      "reversed": "Nghĩ ba lần, nói một lần; nghe nhiều hơn. Đào sâu một hướng thay vì trải mỏng khắp nơi."
    },
    "categories": {
      "love": {
        "upright": "Một cuộc gặp gỡ hay chút thả thính mới — hãy chân thành, tránh phán xét vội vàng.",
        "reversed": "Cãi vã hay tin đồn gây tổn thương — kiểm chứng trước khi phản ứng."
      },
      "career": {
        "upright": "Thực tập, nghiên cứu, soạn thảo — hãy thể hiện khả năng học hỏi và độ nhạy với thông tin.",
        "reversed": "Nói năng lỏng lẻo hoặc hứa vội gây rắc rối — hãy lặng lẽ hoàn thành việc."
      },
      "wealth": {
        "upright": "Để ý thông tin mới và cơ hội nhỏ — học trước khi xuống tiền.",
        "reversed": "Giao dịch theo tin vỉa thì thua — hãy quay về những điều căn bản."
      },
      "health": {
        "upright": "Năng lượng cao nhưng tản mát — nếp sinh hoạt đều giúp bạn vững lại.",
        "reversed": "Lo âu và việc lướt mạng vô độ rút cạn bạn — tạm xa màn hình sẽ giúp."
      }
    }
  },
  {
    "id": "swords_knight",
    "numericId": 61,
    "name": "Kiếm Kỵ Sĩ",
    "nameEn": "Swords Knight",
    "type": "minor",
    "suit": "swords",
    "number": 12,
    "meaning": {
      "upright": "Hành động nhanh quyết đoán, trí tuệ dũng cảm, nhát cắt dứt khoát, mục tiêu rõ ràng",
      "reversed": "Vội vàng liều lĩnh, lời nói gây thương tích, gấp gáp mà không tới đích, lạc mất phương hướng"
    },
    "description": "Kỵ Sĩ Kiếm xông tới với thanh kiếm giơ cao — tư tưởng dẫn dắt tốc độ; bên cạnh lòng dũng cảm luôn có lời cảnh báo về sự kiểm soát.",
    "interpretation": {
      "upright": "Thời điểm cấp bách — bạn tiến lên nhanh, tâm trí và hành động đồng một nhịp. Đàm phán, cuộc đua, quyết định tức thời đều thuận nếu bạn đặt ra giới hạn.",
      "reversed": "Tốc độ vượt qua suy nghĩ; lời nói sắc bén hay nước đi liều lĩnh phản tác dụng. Dũng cảm mà không có đích có thể làm hại chính mình và người xung quanh."
    },
    "advice": {
      "upright": "Tận dụng cửa sổ cơ hội đang mở — hãy xác định rõ giới hạn để thắng lợi vẫn là thắng lợi.",
      "reversed": "Ghìm lại nửa nhịp; làm mềm lưỡi gươm một độ — con đường thường êm hơn."
    },
    "categories": {
      "love": {
        "upright": "Chuyện tình tiến nhanh — đam mê mạnh mẽ; hãy xác nhận hai người cùng nhịp.",
        "reversed": "Tỏ tình bốc đồng hay trận cãi dữ dội để lại hối tiếc — nguội lại rồi hãy nói."
      },
      "career": {
        "upright": "Đấu thầu, chạy nước rút, nhiệm vụ phải đi xa — khả năng thực thi tỏa sáng.",
        "reversed": "Nước đi vội vàng hay xung đột với cấp trên — căn chỉnh mục tiêu trước khi xông lên."
      },
      "wealth": {
        "upright": "Cửa sổ ngắn có thể giao dịch — kỷ luật cắt lỗ và chốt lời.",
        "reversed": "Đuổi theo rồi hoảng loạn thì thua — quay về lộ trình ổn định."
      },
      "health": {
        "upright": "Tập nặng vẫn ổn nếu khởi động kỹ — tránh chấn thương.",
        "reversed": "Làm quá sức và thiếu kiên nhẫn khiến gánh nặng tăng — buộc mình nghỉ."
      }
    }
  },
  {
    "id": "swords_queen",
    "numericId": 62,
    "name": "Kiếm Nữ Hoàng",
    "nameEn": "Swords Queen",
    "type": "minor",
    "suit": "swords",
    "number": 13,
    "meaning": {
      "upright": "Lý trí sáng rõ, cái nhìn xuyên thấu, phán đoán độc lập, lời nói chân thật",
      "reversed": "Lạnh lùng tàn nhẫn, phán xét cay nghiệt, chỉ trích gay gắt, cô lập cảm xúc"
    },
    "description": "Nữ Hoàng Kiếm ngồi cao với thanh kiếm thẳng đứng, ánh mắt xuyên qua mây — hiện thân của lý trí và ranh giới.",
    "interpretation": {
      "upright": "Bạn gạt cảm xúc sang bên để nhìn ra sự thật; xử lý tranh chấp công bằng; lời nói ngắn gọn. Bạn độc lập và được tin cậy nhờ những lời khuyên sáng suốt.",
      "reversed": "Sự sáng rõ biến thành lạnh giá; vết thương cũ trở thành lưỡi dao; những bức tường ngăn hơi ấm bước vào. Hãy phân biệt minh mẫn với tàn nhẫn."
    },
    "advice": {
      "upright": "Ranh giới bảo vệ tất cả — sự thật có thể được nói lên một cách tử tế.",
      "reversed": "Cho phép mình yếu lòng; làm mềm trái tim để sự sống mới bước vào."
    },
    "categories": {
      "love": {
        "upright": "Nhìn rõ mối quan hệ; nói rõ nhu cầu và giới hạn; buông bỏ điều không hợp một cách thành thật.",
        "reversed": "Vết thương cũ đóng sập cánh cửa, hoặc lời nói làm người kia đau — chữa lành trước khi tin tưởng trở lại."
      },
      "career": {
        "upright": "Phân tích, luật, biên tập — đầu óc sáng rõ giành được sự tôn trọng.",
        "reversed": "Thái độ gay gắt với đồng nghiệp hay chính trị hằn học — hãy điều chỉnh giọng điệu bên trong."
      },
      "wealth": {
        "upright": "Kế hoạch ngăn nắp, chi tiêu lý trí — đầu tư không dựa theo cảm xúc.",
        "reversed": "Kiểm soát tiền bằng sợ hãi hay mua sắm trả đũa — tìm lại cân bằng."
      },
      "health": {
        "upright": "Vệ sinh tinh thần rất quan trọng — thiền và viết giữ cho trí óc sáng rõ.",
        "reversed": "Cảm xúc bị dồn nén có thể chuyển thành triệu chứng nơi cơ thể — hãy nói ra hoặc tìm trợ giúp chuyên môn."
      }
    }
  },
  {
    "id": "swords_king",
    "numericId": 63,
    "name": "Kiếm Vua",
    "nameEn": "Swords King",
    "type": "minor",
    "suit": "swords",
    "number": 14,
    "meaning": {
      "upright": "Uy quyền trí tuệ, phán đoán công minh, tư duy chiến lược, pháp trị",
      "reversed": "Lạm dụng quyền lực, kiểm soát lạnh lùng, nói một đằng làm một nẻo, lý trí biến thành vũ khí"
    },
    "description": "Vua Kiếm cầm lưỡi gươm công lý trên ngai đá — tâm trí cai quản vật chất ở mức cấu trúc cao nhất.",
    "interpretation": {
      "upright": "Một nhà lãnh đạo nguyên tắc, hoặc chính khả năng nắm bắt cục diện bằng logic của bạn — những lựa chọn lớn dựa trên bằng chứng và hệ thống; công bằng quan trọng hơn xu nịnh.",
      "reversed": "Quyền lực thao túng hoặc chà đạp; giáo điều cứng nhắc thay cho lòng nhân; nói một đằng làm một nẻo. Coi chừng thứ được gọi là lý trí nhưng thực ra che đậy sự bất công."
    },
    "advice": {
      "upright": "Quyết định dựa trên nguyên tắc và cái giá phải trả của con người — uy quyền sống bằng niềm tin.",
      "reversed": "Xem lại sự cứng nhắc và tính kiểm soát; sức mạnh đích thực bao gồm cả trách nhiệm."
    },
    "categories": {
      "love": {
        "upright": "Quy tắc rõ ràng và cam kết mang lại ổn định cho hôn nhân hay mối quan hệ đối tác.",
        "reversed": "Kiểm soát hay lạnh nhạt biến tình yêu thành trò chơi quyền lực — hãy thương lượng lại."
      },
      "career": {
        "upright": "Thăng chức, quản lý, tranh chấp pháp lý đều thuận cho năng lực chuyên môn.",
        "reversed": "Cấp trên chuyên chế hay ép buộc tinh thần — ghi lại bằng chứng, giữ vững lập trường, tìm hỗ trợ nếu cần."
      },
      "wealth": {
        "upright": "Những nước đi lớn nên đi cùng lời khuyên chuyên gia; hợp đồng và pháp lý đặt lên trước.",
        "reversed": "Coi chừng thương vụ xấu do người có quyền dẫn dắt — đừng ký chỉ vì sợ."
      },
      "health": {
        "upright": "Tuân thủ phác đồ y khoa một cách có hệ thống cho bệnh mạn tính hoặc quá trình hồi phục.",
        "reversed": "Bỏ qua cơ thể để cố sức, hoặc chỉ uống thuốc mà không thay đổi lối sống."
      }
    }
  },
  {
    "id": "pentacles_ace",
    "numericId": 64,
    "name": "Tiền Át",
    "nameEn": "Pentacles Ace",
    "type": "minor",
    "suit": "pentacles",
    "number": 1,
    "meaning": {
      "upright": "Cơ hội mới, khai mở vật chất, khởi đầu thiết thực, phần thưởng đầu tiên",
      "reversed": "Bỏ lỡ cơ hội, nền móng yếu, mục tiêu viển vông, kế hoạch thất bại"
    },
    "description": "Một bàn tay vươn ra từ đám mây trao một đồng tiền — cơ hội hữu hình của đất. Bạn phải hành động mới nhận được thứ đang được trao.",
    "interpretation": {
      "upright": "Một khởi đầu mới trong công việc, tiền bạc hay sức khỏe — hạt giống đã nằm trong tay, việc vun trồng là của bạn. Hãy đặt ý tưởng xuống bước đi thiết thực đầu tiên.",
      "reversed": "Cơ hội tuột khỏi tay vì chưa chuẩn bị hoặc vì quá tham vọng. Lời hứa lớn mà không có kế hoạch — hãy quay về những điều căn bản."
    },
    "advice": {
      "upright": "Nắm lấy cơ hội thiết thực. Bắt đầu từ việc nhỏ để giấc mơ chạm được đất.",
      "reversed": "Xem lại vì sao cơ hội bị bỏ lỡ. Rèn kỹ năng và tích lũy cho lần gõ cửa sau."
    },
    "categories": {
      "love": {
        "upright": "Mối quan hệ tiến triển theo hướng thiết thực — bàn chuyện kết hôn, chung nhà, ổn định thay vì lời ngon tiếng ngọt.",
        "reversed": "Một mối lương duyên tốt bị đánh mất vì do dự hay lập trường yếu ớt — trước tiên hãy biết mình muốn gì."
      },
      "career": {
        "upright": "Việc làm mới, dự án mới hoặc cơ hội đào tạo — đầu tư bền bỉ sẽ sinh lời.",
        "reversed": "Lời mời bị vuột mất hay khởi nghiệp đình trệ — củng cố hồ sơ và tay nghề trước khi thử lại."
      },
      "wealth": {
        "upright": "Thu nhập từ lao động mở ra — gửi tiết kiệm, bất động sản hoặc đầu tư đều đặn đều phù hợp.",
        "reversed": "Khó có chuyện của trời rơi; kế hoạch đổ vỡ — cắt chi tiêu, giữ gìn tài sản hiện có."
      },
      "health": {
        "upright": "Nền tảng có thể xây được — ăn uống điều độ và vận động chính là đồng tiền đầu tiên.",
        "reversed": "Dấu hiệu nhỏ bị bỏ qua hoặc thói quen bị bỏ dở — hãy bắt đầu lại bằng một việc nhỏ mỗi ngày."
      }
    }
  },
  {
    "id": "pentacles_two",
    "numericId": 65,
    "name": "Tiền Hai",
    "nameEn": "Pentacles Two",
    "type": "minor",
    "suit": "pentacles",
    "number": 2,
    "meaning": {
      "upright": "Cân bằng, linh hoạt, làm nhiều việc cùng lúc, thu chi hài hòa",
      "reversed": "Quá tải, mất cân bằng, ưu tiên lộn xộn, kiệt sức"
    },
    "description": "Tiền Hai nhảy múa với hai đồng xu trên mặt biển đang đổi thay — nghệ thuật cân bằng vật chất và thời gian trong chuyển động.",
    "interpretation": {
      "upright": "Nhiều sợi dây tiền bạc hay công việc cần bạn tung hứng — ưu tiên và sự linh hoạt chính là tài sản lúc này.",
      "reversed": "Quá nhiều quả bóng rơi xuống — lịch trình hoặc ngân sách nghiêng lệch. Hãy cắt bớt cam kết và lập lại trật tự."
    },
    "advice": {
      "upright": "Sắp thứ tự ưu tiên và biết nói không — nhịp điệu trong thay đổi tốt hơn sự kiểm soát hoàn hảo.",
      "reversed": "Buông bớt gánh nặng phụ. Ổn định một mặt trận trước khi vơ thêm mặt trận khác."
    },
    "categories": {
      "love": {
        "upright": "Cân bằng công việc và chuyện tình — nói thật với nhau về thời gian để tránh bỏ bê.",
        "reversed": "Bận rộn hay áp lực tiền bạc khiến bạn quên người ấy — hãy điều chỉnh lại sự chú ý."
      },
      "career": {
        "upright": "Nhiều dự án vẫn xoay xở được nhờ công cụ và phân công hợp lý.",
        "reversed": "Nhận quá nhiều việc dẫn đến sai sót — thống nhất ưu tiên với quản lý và cắt gọn."
      },
      "wealth": {
        "upright": "Tiền bạc eo hẹp nhưng vẫn xoay được — ngân sách và sổ sách giữ bạn nổi.",
        "reversed": "Áp lực thâm hụt tăng — cắt ngay những khoản chi không thiết yếu."
      },
      "health": {
        "upright": "Xen nghỉ ngơi và vận động vào những ngày bận rộn để giữ được nhịp.",
        "reversed": "Kiệt sức và giấc ngủ hỗn loạn — buộc mình dành thời gian hồi phục."
      }
    }
  },
  {
    "id": "pentacles_three",
    "numericId": 66,
    "name": "Tiền Ba",
    "nameEn": "Pentacles Three",
    "type": "minor",
    "suit": "pentacles",
    "number": 3,
    "meaning": {
      "upright": "Làm việc nhóm, tay nghề điêu luyện, sự thành thạo lớn dần, cùng nhau xây dựng",
      "reversed": "Hợp tác kém, việc làm cẩu thả, bất hòa, kết quả tồi"
    },
    "description": "Tiền Ba cho thấy người thợ thủ công và các giáo sĩ bên bản vẽ nhà thờ — hợp tác nghề nghiệp biến tầm nhìn thành kết cấu.",
    "interpretation": {
      "upright": "Đội ngũ vận hành trơn tru; mỗi người góp một phần tài năng vào công trình bạn có thể tự hào. Việc học hỏi, học nghề, làm liên ngành nâng giá trị của bạn trên thị trường.",
      "reversed": "Xích mích nội bộ, đứt gãy giao tiếp hoặc làm tắt bớt công đoạn dẫn đến kết quả kém. Hãy thiết lập lại tiêu chuẩn và vai trò."
    },
    "advice": {
      "upright": "Học từ những người bậc thầy; chia sẻ công lao — công trình lớn được xây từng viên gạch.",
      "reversed": "Thống nhất mục tiêu và chuẩn chất lượng trước khi tiếp tục; sự hợp tác không phù hợp có thể tạm dừng."
    },
    "categories": {
      "love": {
        "upright": "Cùng nhau lên kế hoạch cho tổ ấm, đám cưới hay tương lai — hợp sức làm tình yêu vững vàng.",
        "reversed": "Bất đồng về việc nhà hay quan điểm tiền bạc — hãy đặt ra quy tắc gia đình công bằng."
      },
      "career": {
        "upright": "Hợp tác, người dẫn dắt, chứng chỉ nghề nâng tầm tên tuổi của bạn.",
        "reversed": "Đùn đẩy trách nhiệm hay phạm vi công việc phình ra — xác định rõ ranh giới và tiêu chí nghiệm thu."
      },
      "wealth": {
        "upright": "Hợp danh, đầu tư đều đặn, thu nhập từ kỹ năng — danh tiếng sinh lời theo thời gian.",
        "reversed": "Tranh chấp đối tác hay chất lượng giảm ảnh hưởng tới túi tiền — cần hợp đồng rõ ràng."
      },
      "health": {
        "upright": "Phác đồ kết hợp hoặc tập luyện theo nhóm — trách nhiệm chung giúp ích rất nhiều.",
        "reversed": "Kế hoạch thực hiện kém — thay cách làm hoặc thay người, đừng an phận."
      }
    }
  },
  {
    "id": "pentacles_four",
    "numericId": 67,
    "name": "Tiền Bốn",
    "nameEn": "Pentacles Four",
    "type": "minor",
    "suit": "pentacles",
    "number": 4,
    "meaning": {
      "upright": "Gìn giữ, nắm chắc thận trọng, an toàn, bảo tồn nguồn lực",
      "reversed": "Nắm quá chặt, sợ hãi keo kiệt, ôm giữ mà mất, tầm nhìn hẹp"
    },
    "description": "Tiền Bốn ôm chặt một đồng xu trước ngực, chân đè lên một đồng khác — sự tận tụy với an toàn vật chất và việc canh giữ.",
    "interpretation": {
      "upright": "Hãy tiết kiệm và bảo vệ những gì bạn đã gây dựng — giai đoạn thận trọng lúc này khôn ngoan hơn mở rộng mù quáng. Quỹ dự phòng và dòng tiền ổn định mang lại bình an.",
      "reversed": "Tích trữ, keo kiệt hay nỗi sợ mất mát chặn dòng chảy lành mạnh. Nắm quá chặt khiến bạn đánh đổi mối quan hệ và sự thoải mái."
    },
    "advice": {
      "upright": "Tiết kiệm khôn ngoan, chi cho điều đáng chi — nền tảng vững rồi mới mở rộng.",
      "reversed": "Cho phép dòng chảy vừa phải và sự chia sẻ — đồng xu nằm im không sinh sôi."
    },
    "categories": {
      "love": {
        "upright": "Sự ổn định và khả năng chu cấp tạo an tâm — nhưng trái tim cũng phải hòa vào sổ sách.",
        "reversed": "Chiếm hữu hay tính toán từng đồng đầu độc tình yêu — cần tin tưởng và rộng lượng."
      },
      "career": {
        "upright": "Giữ vị trí và những khách hàng then chốt — thời điểm này nên nhịp bước đều hơn là nhảy liều.",
        "reversed": "Sợ thay đổi khiến sự nghiệp trì trệ; hoặc ôm hết công lao sinh ra oán hận."
      },
      "wealth": {
        "upright": "Tiền tiết kiệm, bảo hiểm, bất động sản được đặt đúng chỗ — nền tài chính vững mạnh.",
        "reversed": "Tiền nằm im vì sợ hãi, hay tiết kiệm giả tạo làm hại sức khỏe và chất lượng."
      },
      "health": {
        "upright": "Duy trì những thói quen tốt hiện có — tránh thay đổi cực đoan.",
        "reversed": "Xét nghiệm vì lo âu hay bổ sung quá liều — thư giãn tinh thần chính là thuốc."
      }
    }
  },
  {
    "id": "pentacles_five",
    "numericId": 68,
    "name": "Tiền Năm",
    "nameEn": "Pentacles Five",
    "type": "minor",
    "suit": "pentacles",
    "number": 5,
    "meaning": {
      "upright": "Khó khăn, cô lập, thiếu thốn vật chất, bước đi giữa mùa đông",
      "reversed": "Nhẹ nhõm đang tới, trợ giúp ở gần, giàu có bên trong, rời khỏi tuyết"
    },
    "description": "Tiền Năm cho thấy những bóng người trong tuyết đi ngang qua ngôi nhà thờ đang sáng đèn — thiếu thốn mà sự trợ giúp vẫn ở ngay kề bên.",
    "interpretation": {
      "upright": "Áp lực về tiền bạc hoặc sức khỏe; cảm giác bị bỏ rơi — nhưng ngọn đèn nơi cửa sổ nói rằng trợ giúp vẫn tồn tại nếu bạn ngước lên.",
      "reversed": "Giai đoạn bóp nghẹt nhất dịu xuống; sự trợ giúp xuất hiện; sức mạnh nội tâm tìm được chỗ đứng. Vật chất còn chật vật, nhưng tinh thần có thể dẫn đường."
    },
    "advice": {
      "upright": "Hãy nhờ người mình tin tưởng. Kiểm kê những gì còn lại — mùa đông không kéo dài mãi.",
      "reversed": "Nhận sự hỗ trợ mà không thấy xấu hổ. Xây một kỹ năng có thể kiếm ra tiền để tiến tới nền đất tốt hơn."
    },
    "categories": {
      "love": {
        "upright": "Tiền bạc hoặc khoảng cách làm nguội lạnh tình cảm — cần nâng đỡ lẫn nhau.",
        "reversed": "Sự chia cách hay lạnh nhạt có thể tan đi — hãy cùng nhau đối mặt gian khó."
      },
      "career": {
        "upright": "Mất việc, giảm lương hay đình trệ — cắt chi phí, mở rộng tìm kiếm, kiên trì qua thung lũng.",
        "reversed": "Cơ hội mới hoặc thu nhập phụ xuất hiện — sự bền bỉ cho thấy bước ngoặt."
      },
      "wealth": {
        "upright": "Tiền bạc eo hẹp — tránh nợ không cần thiết; lo những khoản cơ bản trước.",
        "reversed": "Hoàn tiền, trợ cấp hay việc làm thêm giảm bớt căng thẳng — hãy lên kế hoạch trả nợ và tiết kiệm."
      },
      "health": {
        "upright": "Bệnh kéo dài hay bỏ bê bản thân — hãy đi khám; đừng tiếc từng đồng mà bỏ qua.",
        "reversed": "Tình trạng ổn định lại; sự nâng đỡ của cộng đồng tiếp thêm hy vọng hồi phục."
      }
    }
  },
  {
    "id": "pentacles_six",
    "numericId": 69,
    "name": "Tiền Sáu",
    "nameEn": "Pentacles Six",
    "type": "minor",
    "suit": "pentacles",
    "number": 6,
    "meaning": {
      "upright": "Cho và nhận, trao đổi công bằng, lòng bác ái, chia sẻ lại",
      "reversed": "Cho có điều kiện, bất bình đẳng, món nợ nghĩa vụ, ích kỷ tích trữ"
    },
    "description": "Tiền Sáu cho thấy người thương nhân cầm cán cân trao tiền cho người khốn khó — dòng tiền vận động cùng sự công bằng, bổn phận và tương thuộc.",
    "interpretation": {
      "upright": "Của cải luân chuyển lành mạnh — bạn có thể là người cho hoặc người nhận. Lòng hào phóng và sự biết ơn cùng nhau làm bền chặt mối quan hệ.",
      "reversed": "Món quà kèm điều kiện, hoặc sự giúp đỡ làm người khác bị hạ thấp; chia phần bất công sinh ra oán hận. Hãy xem lại liệu sự trao đổi có thật sự ngang bằng."
    },
    "advice": {
      "upright": "Cho khi có thể; nhận với lời cảm tạ — dòng chảy tạo nên sự sung túc.",
      "reversed": "Cho mà không mua lấy quyền kiểm soát; từ chối thứ tử tế mang tính thao túng."
    },
    "categories": {
      "love": {
        "upright": "Chăm sóc lẫn nhau và quà tặng cân bằng — cho và nhận diễn ra tự nhiên.",
        "reversed": "Trả tiền để kiểm soát hay tính toán chi li — hãy làm rõ kỳ vọng."
      },
      "career": {
        "upright": "Dẫn dắt kèm cặp, thưởng, giúp đỡ liên nhóm tạo cảm giác công bằng và ấm áp.",
        "reversed": "Sự giúp đỡ kẻ cả ẩn chứa cái giá; nguồn lực lệch lạc — hãy để ý chính trị công sở."
      },
      "wealth": {
        "upright": "Từ thiện, phụng dưỡng gia đình hay chia lợi nhuận công bằng — gieo rồi sẽ gom.",
        "reversed": "Cho vay nặng lãi, nợ ân tình hay thuế bất công — tránh thương vụ bóc lột."
      },
      "health": {
        "upright": "Dịch vụ chăm sóc dễ tiếp cận; cộng đồng hỗ trợ quá trình chữa lành.",
        "reversed": "Chi phí hay bảo hiểm cản trở điều trị — hãy đấu tranh cho quyền tiếp cận chính đáng."
      }
    }
  },
  {
    "id": "pentacles_seven",
    "numericId": 70,
    "name": "Tiền Bảy",
    "nameEn": "Pentacles Seven",
    "type": "minor",
    "suit": "pentacles",
    "number": 7,
    "meaning": {
      "upright": "Lao động kiên nhẫn, đánh giá mùa màng, đầu tư dài hạn, dừng lại trước khi gặt",
      "reversed": "Nóng vội, mùa gặt bị trì hoãn, nỗ lực sai hướng, bỏ cuộc sớm"
    },
    "description": "Tiền Bảy cho thấy người nông dân tựa vào cây cuốc, ngắm nhìn giàn nho — việc đã làm xong; phán đoán và chờ đợi trước khi hái.",
    "interpretation": {
      "upright": "Công sức đã nằm trong đất — đừng vội hái quả. Hãy xem lại tiến độ và điều chỉnh; mùa vẫn còn đang xoay.",
      "reversed": "Không có kết quả sinh ra bồn chồn, hoặc nỗ lực nhắm sai hướng. Hãy kiên trì hay chuyển hướng dựa trên một phép đọc chỉ số hoàn vốn trung thực."
    },
    "advice": {
      "upright": "Để kế hoạch chín muồi — xem lại định kỳ, đừng ngày nào cũng nhổ lên xem rễ.",
      "reversed": "Đo đầu vào so với đầu ra — kiên trì với thứ hiệu quả, bỏ thứ không."
    },
    "categories": {
      "love": {
        "upright": "Mối gắn kết sâu dần — thiếu tia lửa chưa chắc đã kém vững chắc.",
        "reversed": "Chờ đợi đơn phương quá lâu — hãy xem lại liệu hy vọng có vượt xa hồi đáp."
      },
      "career": {
        "upright": "Đánh giá giữa dự án, thăng chức đang ủ men — kết quả bàn giao đều đặn được tính đến.",
        "reversed": "Vuột mất thăng chức hoặc sai lĩnh vực — cân nhắc chuyển vị trí hoặc ra ngoài."
      },
      "wealth": {
        "upright": "Giai đoạn nắm giữ với quỹ, bất động sản, kinh doanh — kiên nhẫn chính là lợi suất.",
        "reversed": "Hiệu suất kém hay cú lừa — đừng dồn thêm, hãy cắt tỉa hoặc thoát ra một cách lý trí."
      },
      "health": {
        "upright": "Hồi phục hay thay đổi cân nặng cần thời gian — kiên trì với thói quen.",
        "reversed": "Phác đồ chưa hiệu quả — gặp lại bác sĩ, đổi kế hoạch, dừng con đường vô ích."
      }
    }
  },
  {
    "id": "pentacles_eight",
    "numericId": 71,
    "name": "Tiền Tám",
    "nameEn": "Pentacles Eight",
    "type": "minor",
    "suit": "pentacles",
    "number": 8,
    "meaning": {
      "upright": "Tinh thông tay nghề, miệt mài học hỏi, kỹ năng sinh lời, rèn luyện tập trung",
      "reversed": "Việc làm cẩu thả, kỹ năng mai một, chán ngán sự lặp lại, chất lượng giảm"
    },
    "description": "Tiền Tám khắc từng đồng xu nối tiếp trong xưởng — con đường của đất, nơi sự lặp lại tôi luyện nên tay nghề xuất sắc.",
    "interpretation": {
      "upright": "Bạn đang lặn sâu vào việc mài giũa kỹ năng — luyện tập đều đặn mang lại bước tiến đo đếm được. Sự tinh thông đi qua rất nhiều lần hoàn hảo nhỏ.",
      "reversed": "Sự lặp lại sinh ra nhàm chán; chất lượng tuột dốc; vội vàng bỏ qua nền tảng. Hãy làm mới sự trân trọng nghề hoặc đổi hướng học."
    },
    "advice": {
      "upright": "Hoàn thành xuất sắc công việc của hôm nay — lặp lại là bậc thang, không phải hình phạt.",
      "reversed": "Quay về nền tảng và những mẫu chuẩn; nếu hướng đi sai, hãy chuyển sang nghề xứng đáng hơn."
    },
    "categories": {
      "love": {
        "upright": "Sự chăm sóc hằng ngày — nấu ăn, hiện diện, những việc nhỏ — sưởi ấm tình yêu hơn cả lời nói.",
        "reversed": "Bỏ bê hay làm cho có — hãy thể hiện tình cảm bằng hành động."
      },
      "career": {
        "upright": "Đào tạo, chứng chỉ, chuyên môn sâu nâng cao lợi thế cạnh tranh.",
        "reversed": "Làm cẩu thả bị phàn nàn, hoặc kiệt sức — hãy lập lại tiêu chuẩn hoặc đổi vai trò."
      },
      "wealth": {
        "upright": "Kỹ năng, nghề phụ, chất lượng sản phẩm mang lại thu nhập thêm ổn định.",
        "reversed": "Cắt bớt công đoạn tiết kiệm được một xu, nhưng mất cả cân danh tiếng."
      },
      "health": {
        "upright": "Vận động mỗi ngày và ghi lại bữa ăn làm cơ thể mạnh dần theo thời gian.",
        "reversed": "Tập lúc có lúc không hoặc sai tư thế gây chấn thương — hãy tìm hướng dẫn đúng."
      }
    }
  },
  {
    "id": "pentacles_nine",
    "numericId": 72,
    "name": "Tiền Chín",
    "nameEn": "Pentacles Nine",
    "type": "minor",
    "suit": "pentacles",
    "number": 9,
    "meaning": {
      "upright": "Tự chủ, thoải mái do chính mình làm ra, tận hưởng thành quả, độc lập thanh lịch",
      "reversed": "Chi tiêu phô trương, phụ thuộc, khoái cảm rỗng, lo lắng tiền bạc âm thầm"
    },
    "description": "Tiền Chín cho thấy người phụ nữ thư thái trong khu vườn cùng chim ưng — sự an nhàn mua bằng chính sức lao động của mình, cô độc là phần thưởng chứ không phải thiếu thốn.",
    "interpretation": {
      "upright": "Bạn tự nuôi sống được bản thân và có thể tận hưởng những vẻ đẹp do mình làm ra — sự sang trọng tĩnh lặng là chính đáng. Độc lập là sức mạnh.",
      "reversed": "Khoe của mà lòng trống rỗng, hoặc sống dựa vào túi tiền người khác. Chi tiêu che lấp bất an — hãy xây lại giá trị nội tại."
    },
    "advice": {
      "upright": "Tận hưởng mùa gặt đi kèm kỷ luật — sự sung túc có thể kéo dài.",
      "reversed": "Tách khoái cảm khỏi sự phô bày. Thu nhập và lợi tức của riêng bạn giữ gìn phẩm giá."
    },
    "categories": {
      "love": {
        "upright": "Độc thân mà viên mãn, hoặc có đôi với khoảng trời lành mạnh — sự duyên dáng chín chắn thu hút người khác.",
        "reversed": "Ở lại vì tiền hay ngoại diện, hoặc cô đơn mà trống trải — cần sự viên mãn từ bên trong."
      },
      "career": {
        "upright": "Thành công và đãi ngộ ổn định — hãy tận hưởng kết quả và chia sẻ công bằng với đội ngũ.",
        "reversed": "Chức danh không có thực chất, hoặc thú vui làm hại hiệu suất."
      },
      "wealth": {
        "upright": "Thu nhập thụ động hay tài sản vững mạnh — lối sống độc lập có kế hoạch rất phù hợp.",
        "reversed": "Hàng hiệu rút cạn tiết kiệm, hoặc nợ nần ẩn sau vẻ ngoài — hãy thắt chặt ngân sách ngay."
      },
      "health": {
        "upright": "Sức khỏe tốt — thư giãn hay du lịch là phần thưởng hợp lý nếu có chừng mực.",
        "reversed": "Nuông chiều và thức khuya gây hại — xa hoa không thay được nhịp sống."
      }
    }
  },
  {
    "id": "pentacles_ten",
    "numericId": 73,
    "name": "Tiền Mười",
    "nameEn": "Pentacles Ten",
    "type": "minor",
    "suit": "pentacles",
    "number": 10,
    "meaning": {
      "upright": "Thịnh vượng lâu dài, của cải gia đình, ổn định bền lâu, viên mãn nơi hạ giới",
      "reversed": "Suy tàn, tranh chấp thừa kế, thịnh vượng giả tạo, gốc rễ lung lay"
    },
    "description": "Tiền Mười cho thấy cơ nghiệp nhiều thế hệ dưới khung vòm — nguyên tố đất viên mãn qua thời gian và huyết thống.",
    "interpretation": {
      "upright": "Vật chất và gia đình gần chạm ngưỡng viên mãn — tổ ấm, tiền tiết kiệm, phúc lành của bậc trưởng bối, hay cơ nghiệp kinh doanh xây nên tương lai vững chắc cho nhiều người.",
      "reversed": "Tranh cãi tiền bạc gia tộc, sống dựa vào phần thừa kế đang cạn dần, hoặc vẻ hào nhoáng mà thiếu gắn kết. Hãy hàn gắn quan hệ và giấy tờ sớm."
    },
    "advice": {
      "upright": "Hãy quản lý điều mình được thừa hưởng hay đã gây dựng — di chúc rõ ràng và những cuộc trò chuyện gia đình giúp sự sung túc kéo dài.",
      "reversed": "Thương lượng chuyện thừa kế một cách cởi mở — tự lực bền lâu hơn cơ nghiệp mong manh."
    },
    "categories": {
      "love": {
        "upright": "Hôn nhân, ra mắt gia đình, xây tổ ấm — phúc lành của bậc trưởng bối thêm phần vững chắc.",
        "reversed": "Tài sản, của hồi môn hay tiền bạc họ hàng gây xung đột — hãy thương lượng trong bình tĩnh."
      },
      "career": {
        "upright": "Công ty gia đình, bệ đỡ cấp cao, hoặc con đường nghỉ hưu đều vững vàng.",
        "reversed": "Tranh giành quyền kế nghiệp hay ngành suy giảm — đa dạng hóa kỹ năng và thu nhập."
      },
      "wealth": {
        "upright": "Bất động sản, quỹ tín thác, bảo hiểm khớp nhau — của cải có thể truyền qua nhiều thế hệ.",
        "reversed": "Di sản bất công hay đầu tư tồi — hãy tìm luật sư và kế toán ngay."
      },
      "health": {
        "upright": "Thói quen gia đình tốt và gen trường thọ — khám sức khỏe định kỳ giữ vững phong độ.",
        "reversed": "Nguy cơ di truyền hay áp lực gia đình — cần chăm sóc dự phòng và tư vấn tâm lý."
      }
    }
  },
  {
    "id": "pentacles_page",
    "numericId": 74,
    "name": "Tiền Tiểu Đồng",
    "nameEn": "Pentacles Page",
    "type": "minor",
    "suit": "pentacles",
    "number": 11,
    "meaning": {
      "upright": "Học trò ham học, giấc mơ thiết thực, người học việc mới, tò mò có nền tảng",
      "reversed": "Mơ cao mà không làm, lười biếng trì hoãn, tham vọng rỗng, việc học bế tắc"
    },
    "description": "Tiền Tiểu Đồng nghiền ngẫm đồng xu như đọc một cuốn sách — khát khao non trẻ của đất, muốn học hỏi và hiện thực hóa giấc mơ thành vật chất.",
    "interpretation": {
      "upright": "Sự hào hứng với việc học, tài chính hay một dự định mới — bạn sẵn lòng khởi đầu từ dưới cùng. Tin tức hay cơ hội có thể đang thành hình; hành động sẽ chuyển nó thành hiện thực.",
      "reversed": "Nhiều giấc mơ mà ít bước đi; trì hoãn hoặc nhắm quá cao khiến khởi đầu đình trệ. Hãy thu nhỏ tầm nhìn thành một bước nhỏ mỗi ngày."
    },
    "advice": {
      "upright": "Đăng ký học, lập ngân sách, phác thảo kế hoạch — bất cứ hành động cụ thể nào cũng hơn là chỉ ngồi mơ.",
      "reversed": "Hoàn thành mục tiêu nhỏ nhất trong tuần này — đà tiến thắng sự lười biếng."
    },
    "categories": {
      "love": {
        "upright": "Tình cảm trẻ trung hay giản dị — chân thành đáng giá hơn lời hoa mỹ.",
        "reversed": "Lời hứa rỗng làm người kia thất vọng — hãy chứng minh bằng hành động."
      },
      "career": {
        "upright": "Thực tập sinh hay nhân viên mới tỏa sáng — nhà tuyển dụng có thể đầu tư vào bạn.",
        "reversed": "Thói lơ là làm mất cơ hội thăng tiến — hãy chỉnh lại thái độ và giờ giấc."
      },
      "wealth": {
        "upright": "Bắt đầu học những kiến thức tiền bạc cơ bản, ghi sổ, đầu tư nhỏ — hiểu biết sẽ sinh lời theo cấp số.",
        "reversed": "Hội thảo làm giàu không cần làm, nguy cơ lừa đảo — hãy quay về tiết kiệm và rèn kỹ năng."
      },
      "health": {
        "upright": "Ghi lại bữa ăn và vận động — cơ thể trẻ cũng cần thói quen.",
        "reversed": "Thức khuya và bỏ bữa tích lũy cái giá về sau — hãy điều chỉnh ngay."
      }
    }
  },
  {
    "id": "pentacles_knight",
    "numericId": 75,
    "name": "Tiền Kỵ Sĩ",
    "nameEn": "Pentacles Knight",
    "type": "minor",
    "suit": "pentacles",
    "number": 12,
    "meaning": {
      "upright": "Cần mẫn đều đặn, tiến bộ đáng tin, lao nhọc thường nhật, kiên nhẫn bền bỉ",
      "reversed": "Cứng nhắc trì trệ, thói quen vô cảm, quá thận trọng, bỏ lỡ khai mở"
    },
    "description": "Tiền Kỵ Sĩ di chuyển chậm rãi trên con ngựa sẫm màu, đồng xu trong tay — bước hành quân kiên nhẫn nhất của đất; chậm nhưng chưa từng lạc đường.",
    "interpretation": {
      "upright": "Bổn phận hằng ngày được làm cẩn thận — tiến bộ thấy được qua sự tích lũy. Sự đáng tin thắng vẻ hào nhoáng; nếp thường nhật chính là thắng lợi.",
      "reversed": "Quá thận trọng đến mức không chịu uốn mình — cuộc sống như lồng giam. Hoặc nỗi sợ chặn một cơ hội hợp lý. Hãy tìm khe hở giữa ổn định và cũ kỹ."
    },
    "advice": {
      "upright": "Giữ đúng nhịp — tin vào thời gian và tiếng vó đều.",
      "reversed": "Đưa vào một thay đổi nhỏ; nhận rủi ro có tính toán; phá vỡ câu để mai bất tận."
    },
    "categories": {
      "love": {
        "upright": "Tận tụy bền bỉ và lời hứa — lặng lẽ nhưng đáng tin cho chặng đường dài.",
        "reversed": "Mối quan hệ như nghi lễ tẻ nhạt, hoặc một bên quá chậm — hãy cân nhắc giữa tia lửa và sự an toàn."
      },
      "career": {
        "upright": "Công việc đòi hỏi chi tiết và bền sức rất phù hợp — chuyên cần và bàn giao đầy đủ dẫn đến thăng tiến về sau.",
        "reversed": "Từ chối mọi nhiệm vụ mới khiến bạn bị gạt ra rìa, hoặc nhàm chán bào mòn ý chí — hãy điều chỉnh vai trò."
      },
      "wealth": {
        "upright": "Lương, tiết kiệm đều, tăng trưởng rủi ro thấp — giàu lên từng bước tích lũy.",
        "reversed": "Quá an toàn bỏ lỡ tăng trưởng, hoặc lười nhác để lạm phát ăn mòn tiền nhàn rỗi."
      },
      "health": {
        "upright": "Ngủ đều và lao động vừa sức giúp quản lý bệnh mạn tính.",
        "reversed": "Sự ì tại chỗ làm cơ thể cứng lại — hãy phá thói quen bằng vận động nhẹ nhàng mới mẻ."
      }
    }
  },
  {
    "id": "pentacles_queen",
    "numericId": 76,
    "name": "Tiền Nữ Hoàng",
    "nameEn": "Pentacles Queen",
    "type": "minor",
    "suit": "pentacles",
    "number": 13,
    "meaning": {
      "upright": "Người chu cấp ấm áp, nuôi dưỡng thiết thực, sung túc dễ chịu, chăm sóc đời thường",
      "reversed": "Bỏ quên bản thân, làm việc quá sức, bám chấp vật chất, chăm sóc bao bọc ngột ngạt"
    },
    "description": "Tiền Nữ Hoàng ngồi trong khu vườn tươi tốt, đồng xu trên đùi — sự nuôi dưỡng ấm áp và thiết thực tạo nên sự sung túc an toàn về vật chất.",
    "interpretation": {
      "upright": "Bạn làm cho tổ ấm và công việc trở nên màu mỡ — chăm sóc đi cùng năng lực, chia sẻ của cải và sự thoải mái, là điểm tựa đáng tin cho người khác.",
      "reversed": "Cho hết ra ngoài mà trống rỗng bên trong, hoặc mua tình cảm bằng quà cáp. Kiểm soát ngụy trang thành chăm sóc — hãy lấy lại cân bằng của nữ hoàng."
    },
    "advice": {
      "upright": "Chăm lo cho người khác sau khi đã tiếp năng lượng cho mình — chén phải đầy mới rót được.",
      "reversed": "Hãy nhờ giúp đỡ; buông kiểm soát; yêu thương bản thân mới cho đi được bền lâu."
    },
    "categories": {
      "love": {
        "upright": "Chăm chút tổ ấm, sự ấm áp, tận tụy thiết thực — người ấy cảm thấy an toàn và được trân trọng.",
        "reversed": "Làm hết mọi thứ cho họ, hoặc yêu như một danh sách mua sắm — hãy thêm những lời nói từ cảm xúc."
      },
      "career": {
        "upright": "Nhân sự, ẩm thực, gia đình, tư vấn tài chính — kết hợp sự chăm sóc với năng lực.",
        "reversed": "Người hay nhận việc ở công sở bị quá tải — cần đặt ranh giới và biết từ chối."
      },
      "wealth": {
        "upright": "Quản lý ngân sách hộ gia đình và phân bổ khéo léo — của cải vừa phải nhờ tiết kiệm và kế hoạch.",
        "reversed": "Chi cho gia đình mà quên bản thân, hoặc mua sắm lấp khoảng trống — hãy tái lập cân bằng."
      },
      "health": {
        "upright": "Nấu ăn, làm vườn, mát-xa nuôi dưỡng — sức chữa lành mạnh mẽ của đất.",
        "reversed": "Bỏ qua cơ thể mình để chăm người khác — cân nặng và ăn uống cần được ưu tiên."
      }
    }
  },
  {
    "id": "pentacles_king",
    "numericId": 77,
    "name": "Tiền Vua",
    "nameEn": "Pentacles King",
    "type": "minor",
    "suit": "pentacles",
    "number": 14,
    "meaning": {
      "upright": "Làm chủ tài chính, lãnh đạo vững vàng, thành tựu vật chất, uy quyền thịnh vượng",
      "reversed": "Tham lam, đầu óc chỉ nghĩ tới lợi nhuận, giàu có rỗng tuếch, khủng hoảng tài chính"
    },
    "description": "Tiền Vua ngồi trên ngai giữa vườn nho và lâu đài — sức mạnh của đất ở đỉnh cao; của cải và cơ đồ được cai quản bởi bàn tay từng trải.",
    "interpretation": {
      "upright": "Bạn gặp gỡ hoặc trở thành người quản lý trưởng thành của các nguồn lực — kế hoạch dài hạn, kiểm soát rủi ro và lợi ích chính đáng mang lại ảnh hưởng bền vững.",
      "reversed": "Lòng tham làm hỏng phán đoán; theo đuổi phi đạo đức hoặc vẻ ngoài giàu sang mà kho tiền trống rỗng. Nguy cơ bê bối, đầu tư thất bại, hoặc rạn nứt tiền bạc trong gia đình tăng cao."
    },
    "advice": {
      "upright": "Lãnh đạo bằng sự chính trực và tầm nhìn xa — của cải phục vụ đời sống, không phải ngược lại.",
      "reversed": "Xem lại động cơ và tính tuân thủ; xây lại niềm tin thay vì chỉ giữ thể diện."
    },
    "categories": {
      "love": {
        "upright": "Người bạn đời đáng tin cả về tình cảm lẫn vật chất — hãy cùng nhau xây tổ ấm và tài sản.",
        "reversed": "Coi người yêu như tài sản, hoặc nợ nần của người ấy bị che giấu — cần sự rõ ràng."
      },
      "career": {
        "upright": "Con đường giám đốc điều hành, nhà đầu tư, quản lý cấp cao rất mạnh — thương hiệu và thực chất thắng về lâu dài.",
        "reversed": "Sai phạm đạo đức hoặc mở rộng quá đà làm đứt chuỗi tiền mặt — hãy củng cố lại phần lõi."
      },
      "wealth": {
        "upright": "Tài sản đa dạng hóa vững mạnh — bất động sản, kinh doanh, kế hoạch tín thác đều phù hợp.",
        "reversed": "Rủi ro thuế, nợ, gian lận — hãy kiểm toán ngay và cắt giảm mức phơi nhiễm."
      },
      "health": {
        "upright": "Được tiếp cận dịch vụ chăm sóc tốt — vẫn cần chừng mực trong ăn uống và căng thẳng vì quá trình trao đổi chất.",
        "reversed": "Chế độ ăn giàu có gây bệnh hoặc ăn để giải tỏa căng thẳng — tiền không mua được kỷ luật mà bạn từ chối."
      }
    }
  }
];

export const TAROT_DATA_BY_ID: Record<string, TarotCardData> = Object.fromEntries(
  TAROT_DATA.map((card) => [card.id, card]),
);
