import 'numerology_result.dart';

class NumerologyCalculator {
  static final Map<String, int> _letterValues = {
    'A': 1, 'J': 1, 'S': 1,
    'B': 2, 'K': 2, 'T': 2,
    'C': 3, 'L': 3, 'U': 3,
    'D': 4, 'M': 4, 'V': 4,
    'E': 5, 'N': 5, 'W': 5,
    'F': 6, 'O': 6, 'X': 6,
    'G': 7, 'P': 7, 'Y': 7,
    'H': 8, 'Q': 8, 'Z': 8,
    'I': 9, 'R': 9,
  };

  static final Set<String> _vowels = {'A', 'E', 'I', 'O', 'U', 'Y'};

  static String _removeDiacritics(String str) {
    var withDiacritics = 'àáãạảăắằẳẵặâấầẩẫậèéẹẻẽêềếểễệđìíĩỉịòóõọỏôốồổỗộơớờởỡợùúũụủưứừửữựỳýỵỷỹ';
    var withoutDiacritics = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeediiiiiooooooooooooooooouuuuuuuuuuuyyyyy';
    
    for (int i = 0; i < withDiacritics.length; i++) {
      str = str.replaceAll(withDiacritics[i], withoutDiacritics[i]);
      str = str.replaceAll(withDiacritics[i].toUpperCase(), withoutDiacritics[i].toUpperCase());
    }
    return str;
  }

  static int _reduceToSingleDigit(int number) {
    if (number == 0) return 0;
    while (number > 9 && number != 11 && number != 22 && number != 33) {
      int sum = 0;
      int temp = number;
      while (temp > 0) {
        sum += temp % 10;
        temp ~/= 10;
      }
      number = sum;
    }
    return number;
  }

  static NumerologyResult calculate(String fullName, DateTime dateOfBirth) {
    int lifePath = _calculateLifePath(dateOfBirth);
    
    String normalizedName = _removeDiacritics(fullName).toUpperCase().replaceAll(RegExp(r'[^A-Z]'), '');
    
    int destinySum = 0;
    int soulUrgeSum = 0;
    int personalitySum = 0;

    for (int i = 0; i < normalizedName.length; i++) {
      String letter = normalizedName[i];
      int value = _letterValues[letter] ?? 0;
      
      destinySum += value;
      if (_vowels.contains(letter)) {
        soulUrgeSum += value;
      } else {
        personalitySum += value;
      }
    }

    return NumerologyResult(
      lifePath: lifePath,
      destiny: _reduceToSingleDigit(destinySum),
      soulUrge: _reduceToSingleDigit(soulUrgeSum),
      personality: _reduceToSingleDigit(personalitySum),
    );
  }

  static int _calculateLifePath(DateTime dob) {
    int daySum = _reduceToSingleDigit(dob.day);
    int monthSum = _reduceToSingleDigit(dob.month);
    int yearSum = _reduceToSingleDigit(dob.year);
    
    return _reduceToSingleDigit(daySum + monthSum + yearSum);
  }
}
