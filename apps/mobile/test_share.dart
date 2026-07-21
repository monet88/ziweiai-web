import 'package:share_plus/share_plus.dart';
void main() {
  SharePlus.instance.share(ShareParams(text: 'Hello', files: [XFile('path')]));
}
