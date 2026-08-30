import 'package:go_router/go_router.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/charts/presentation/chart_detail_screen.dart';
import '../../features/charts/data/models/chart_snapshot.dart';
import '../../features/auth/presentation/auth_screen.dart';
import '../../features/wallet/presentation/wallet_screen.dart';
import '../../features/vision/presentation/vision_input_screen.dart';
import '../../features/vision/presentation/vision_result_screen.dart';
import '../../features/vision/data/models/vision_kind.dart';
import '../../features/tarot/presentation/tarot_screen.dart';
import '../../features/numerology/presentation/numerology_screen.dart';
import '../../features/wallet/presentation/wallet_history_screen.dart';
import '../../features/iching/presentation/iching_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/charts/:id',
      builder: (context, state) {
        final chartData = state.extra as ChartDetailResponse;
        return ChartDetailScreen(chartData: chartData);
      },
    ),
    GoRoute(
      path: '/auth',
      builder: (context, state) => const AuthScreen(),
    ),
    GoRoute(
      path: '/wallet',
      builder: (context, state) => const WalletScreen(),
    ),
    GoRoute(
      path: '/wallet/history',
      builder: (context, state) => const WalletHistoryScreen(),
    ),
    GoRoute(
      path: '/vision/input',
      builder: (context, state) {
        final kind = state.extra as VisionKind? ?? VisionKind.face;
        if (kind == VisionKind.tarot) {
          return const TarotScreen();
        }
        return VisionInputScreen(kind: kind);
      },
    ),
    GoRoute(
      path: '/vision/face',
      builder: (context, state) => const VisionInputScreen(kind: VisionKind.face),
    ),
    GoRoute(
      path: '/vision/palm',
      builder: (context, state) => const VisionInputScreen(kind: VisionKind.palm),
    ),
    GoRoute(
      path: '/vision/result',
      builder: (context, state) {
        final result = state.extra as Map<String, dynamic>;
        return VisionResultScreen(result: result);
      },
    ),
    GoRoute(
      path: '/numerology',
      builder: (context, state) => const NumerologyScreen(),
    ),
    GoRoute(
      path: '/iching',
      builder: (context, state) => const IChingScreen(),
    ),
  ],
);
