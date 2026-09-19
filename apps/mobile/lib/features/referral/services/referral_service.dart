import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_provider.dart';

final referralServiceProvider = Provider<ReferralService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ReferralService(apiClient: apiClient);
});

final userReferralCodeProvider = FutureProvider<String?>((ref) async {
  final service = ref.watch(referralServiceProvider);
  return service.getMyReferralCode();
});

final referralStatsProvider = FutureProvider<ReferralStats>((ref) async {
  final service = ref.watch(referralServiceProvider);
  return service.getReferralStats();
});

class ReferralStats {
  final int totalInvited;
  final int totalXuEarned;
  final String myCode;

  const ReferralStats({
    required this.totalInvited,
    required this.totalXuEarned,
    required this.myCode,
  });
}

class ReferralService {
  final SupabaseClient? _injectedSupabase;
  final ApiClient? _apiClient;

  ReferralService({SupabaseClient? supabase, ApiClient? apiClient})
      : _injectedSupabase = supabase,
        _apiClient = apiClient;

  SupabaseClient? get _supabase {
    if (_injectedSupabase != null) return _injectedSupabase;
    try {
      return Supabase.instance.client;
    } catch (_) {
      return null;
    }
  }

  /// Lấy mã giới thiệu của người dùng hiện tại
  Future<String?> getMyReferralCode() async {
    final client = _supabase;
    if (client == null) return 'VIOS8888';

    final user = client.auth.currentUser;
    if (user == null) return 'VIOS8888';

    try {
      final response = await client
          .from('profiles')
          .select('referral_code')
          .eq('user_id', user.id)
          .maybeSingle();

      if (response != null && response['referral_code'] != null) {
        return response['referral_code'] as String;
      }
      return user.id.substring(0, 8).toUpperCase();
    } catch (e) {
      debugPrint('[ReferralService] getMyReferralCode error: $e');
      return user.id.substring(0, 8).toUpperCase();
    }
  }

  /// Thống kê bạn bè đã mời và XU nhận được
  Future<ReferralStats> getReferralStats() async {
    final client = _supabase;
    final code = await getMyReferralCode() ?? 'VIOS8888';
    if (client == null) {
      return ReferralStats(totalInvited: 0, totalXuEarned: 0, myCode: code);
    }

    final user = client.auth.currentUser;
    if (user == null) {
      return ReferralStats(totalInvited: 0, totalXuEarned: 0, myCode: code);
    }

    try {
      final response = await client
          .from('referrals')
          .select('id, reward_xu')
          .eq('referrer_id', user.id);

      final list = (response as List<dynamic>?) ?? [];
      final totalInvited = list.length;
      int totalXu = 0;
      for (final item in list) {
        if (item is Map && item['reward_xu'] is num) {
          totalXu += (item['reward_xu'] as num).toInt();
        } else {
          totalXu += 20; // Default 20 XU per ref
        }
      }

      return ReferralStats(
        totalInvited: totalInvited,
        totalXuEarned: totalXu,
        myCode: code,
      );
    } catch (e) {
      debugPrint('[ReferralService] getReferralStats error: $e');
      return ReferralStats(totalInvited: 0, totalXuEarned: 0, myCode: code);
    }
  }

  /// Nhập mã giới thiệu để nhận +20 XU (kèm turnstileToken chống bot)
  Future<({bool success, int rewardXu, String message})> redeemReferralCode(
    String code, {
    String? turnstileToken,
  }) async {
    final trimmed = code.trim().toUpperCase();
    if (trimmed.isEmpty) {
      return (success: false, rewardXu: 0, message: 'Vui lòng nhập mã giới thiệu');
    }

    final myCode = await getMyReferralCode();
    if (myCode != null && myCode.toUpperCase() == trimmed) {
      return (
        success: false,
        rewardXu: 0,
        message: 'Bạn không thể tự nhập mã giới thiệu của chính mình',
      );
    }

    final client = _supabase;
    if (client == null) {
      return (
        success: true,
        rewardXu: 20,
        message: 'Nhận thành công 20 XU Vận Khí Cung Đình (Mô phỏng)!',
      );
    }

    final user = client.auth.currentUser;
    if (user == null) {
      return (
        success: false,
        rewardXu: 0,
        message: 'Vui lòng khởi tạo phiên đăng nhập để nhập mã',
      );
    }

    try {
      final apiClient = _apiClient;
      if (apiClient != null) {
        if (turnstileToken == null || turnstileToken.trim().isEmpty) {
          return (
            success: false,
            rewardXu: 0,
            message: 'Tính năng nhận thưởng trực tiếp trên Native App đang kết nối Cloudflare Turnstile trong Giai đoạn 2. Quý tri kỷ vui lòng trải nghiệm tại https://tuvitoantap.online.',
          );
        }

        final res = await apiClient.dailyCheckin(
          referralCode: trimmed,
          turnstileToken: turnstileToken,
        );
        final rawReward = res['rewardXu'] ?? res['xu_added'];
        final reward = (rawReward is num) ? rawReward.toInt() : 10;
        return (
          success: true,
          rewardXu: reward > 0 ? reward : 10,
          message: 'Đã nhập mã giới thiệu thành công!',
        );
      }

      final response = await client.rpc('daily_checkin', params: {
        'p_user_id': user.id,
        'p_referral_code': trimmed,
      });

      final reward = (response is num) ? response.toInt() : 10;
      return (
        success: true,
        rewardXu: reward > 0 ? reward : 10,
        message: 'Đã nhập mã giới thiệu thành công!',
      );
    } catch (e) {
      debugPrint('[ReferralService] redeem error: $e');
      if (e is DioException) {
        final data = e.response?.data;
        if (data is Map && data['message'] != null) {
          return (
            success: false,
            rewardXu: 0,
            message: data['message'].toString(),
          );
        }
      }
      return (
        success: false,
        rewardXu: 0,
        message: 'Mã giới thiệu không hợp lệ hoặc đã qua thời hạn áp dụng',
      );
    }
  }
}
