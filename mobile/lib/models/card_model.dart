enum Sport {
  basketball,
  baseball,
  football,
  soccer,
  pokemon,
  f1,
  other,
}

enum Currency {
  usd,
  cny,
}

enum AcquisitionSource {
  selfRip,
  breakSource, // 'break' is a reserved keyword
  ebay,
  cardHobby,
  wecard,
  xianyu,
  cardShow,
  alt,
  fanatics,
  pwcc,
  other,
}

enum Platform {
  ebay,
  cardHobby,
  xianyu,
  cardShow,
  alt,
  fanatics,
  pwcc,
  goldin,
  heritage,
  wecard,
  other,
}

class PricePoint {
  final String date;
  final double value;
  final String? platform;
  final String? parallel;
  final String? grade;
  final String? serialNumber;

  PricePoint({
    required this.date,
    required this.value,
    this.platform,
    this.parallel,
    this.grade,
    this.serialNumber,
  });

  factory PricePoint.fromJson(Map<String, dynamic> json) {
    return PricePoint(
      date: json['date'],
      value: (json['value'] as num).toDouble(),
      platform: json['platform'],
      parallel: json['parallel'],
      grade: json['grade'],
      serialNumber: json['serialNumber'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date,
      'value': value,
      'platform': platform,
      'parallel': parallel,
      'grade': grade,
      'serialNumber': serialNumber,
    };
  }
}

class Offer {
  final String id;
  final double offerPrice;
  final String platform;
  final String senderName;
  final String date;
  final String? notes;

  Offer({
    required this.id,
    required this.offerPrice,
    required this.platform,
    required this.senderName,
    required this.date,
    this.notes,
  });

  factory Offer.fromJson(Map<String, dynamic> json) {
    return Offer(
      id: json['id'],
      offerPrice: (json['offerPrice'] as num).toDouble(),
      platform: json['platform'],
      senderName: json['senderName'],
      date: json['date'],
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'offerPrice': offerPrice,
      'platform': platform,
      'senderName': senderName,
      'date': date,
      'notes': notes,
    };
  }
}

class CardModel {
  final String id;
  final String? imageUrl;
  final String player;
  final int year;
  final Sport sport;
  final String brand;
  final String series;
  final String insert;
  final String? parallel;
  final String? serialNumber;
  final bool graded;
  final String? gradeCompany;
  final String? gradeValue;
  final String? certNumber;
  final Currency currency;
  final String purchaseDate;
  final double purchasePrice;
  final AcquisitionSource? acquisitionSource;
  final String? acquisitionSourceOther;
  final double currentValue;
  final List<PricePoint> priceHistory;
  final List<Offer>? offers;
  final bool sold;
  final String? soldDate;
  final double? soldPrice;
  final bool? watchlist;
  final String? bulkGroupId;
  final String? notes;

  CardModel({
    required this.id,
    this.imageUrl,
    required this.player,
    required this.year,
    required this.sport,
    required this.brand,
    required this.series,
    required this.insert,
    this.parallel,
    this.serialNumber,
    required this.graded,
    this.gradeCompany,
    this.gradeValue,
    this.certNumber,
    required this.currency,
    required this.purchaseDate,
    required this.purchasePrice,
    this.acquisitionSource,
    this.acquisitionSourceOther,
    required this.currentValue,
    required this.priceHistory,
    this.offers,
    required this.sold,
    this.soldDate,
    this.soldPrice,
    this.watchlist,
    this.bulkGroupId,
    this.notes,
  });

  factory CardModel.fromJson(Map<String, dynamic> json) {
    return CardModel(
      id: json['id'],
      imageUrl: json['imageUrl'],
      player: json['player'],
      year: json['year'],
      sport: _parseSport(json['sport']),
      brand: json['brand'],
      series: json['series'],
      insert: json['insert'],
      parallel: json['parallel'],
      serialNumber: json['serialNumber'],
      graded: json['graded'] ?? false,
      gradeCompany: json['gradeCompany'],
      gradeValue: json['gradeValue'],
      certNumber: json['certNumber'],
      currency: _parseCurrency(json['currency']),
      purchaseDate: json['purchaseDate'],
      purchasePrice: (json['purchasePrice'] as num).toDouble(),
      acquisitionSource: _parseAcquisitionSource(json['acquisitionSource']),
      acquisitionSourceOther: json['acquisitionSourceOther'],
      currentValue: (json['currentValue'] as num).toDouble(),
      priceHistory: (json['priceHistory'] as List<dynamic>?)
              ?.map((e) => PricePoint.fromJson(e))
              .toList() ??
          [],
      offers: (json['offers'] as List<dynamic>?)
          ?.map((e) => Offer.fromJson(e))
          .toList(),
      sold: json['sold'] ?? false,
      soldDate: json['soldDate'],
      soldPrice: (json['soldPrice'] as num?)?.toDouble(),
      watchlist: json['watchlist'],
      bulkGroupId: json['bulkGroupId'],
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'imageUrl': imageUrl,
      'player': player,
      'year': year,
      'sport': _sportToString(sport),
      'brand': brand,
      'series': series,
      'insert': insert,
      'parallel': parallel,
      'serialNumber': serialNumber,
      'graded': graded,
      'gradeCompany': gradeCompany,
      'gradeValue': gradeValue,
      'certNumber': certNumber,
      'currency': _currencyToString(currency),
      'purchaseDate': purchaseDate,
      'purchasePrice': purchasePrice,
      'acquisitionSource': _acquisitionSourceToString(acquisitionSource),
      'acquisitionSourceOther': acquisitionSourceOther,
      'currentValue': currentValue,
      'priceHistory': priceHistory.map((e) => e.toJson()).toList(),
      'offers': offers?.map((e) => e.toJson()).toList(),
      'sold': sold,
      'soldDate': soldDate,
      'soldPrice': soldPrice,
      'watchlist': watchlist,
      'bulkGroupId': bulkGroupId,
      'notes': notes,
    };
  }

  static Sport _parseSport(String? value) {
    switch (value) {
      case 'Basketball':
        return Sport.basketball;
      case 'Baseball':
        return Sport.baseball;
      case 'Football':
        return Sport.football;
      case 'Soccer':
        return Sport.soccer;
      case 'Pokemon':
        return Sport.pokemon;
      case 'F1':
        return Sport.f1;
      default:
        return Sport.other;
    }
  }

  static String _sportToString(Sport sport) {
    switch (sport) {
      case Sport.basketball:
        return 'Basketball';
      case Sport.baseball:
        return 'Baseball';
      case Sport.football:
        return 'Football';
      case Sport.soccer:
        return 'Soccer';
      case Sport.pokemon:
        return 'Pokemon';
      case Sport.f1:
        return 'F1';
      case Sport.other:
        return 'Other';
    }
  }

  static Currency _parseCurrency(String? value) {
    return value == 'CNY' ? Currency.cny : Currency.usd;
  }

  static String _currencyToString(Currency currency) {
    return currency == Currency.cny ? 'CNY' : 'USD';
  }

  static AcquisitionSource? _parseAcquisitionSource(String? value) {
    if (value == null) return null;
    switch (value) {
      case 'Self Rip (Case/Box)':
        return AcquisitionSource.selfRip;
      case 'Break':
        return AcquisitionSource.breakSource;
      case 'eBay':
        return AcquisitionSource.ebay;
      case 'CardHobby':
        return AcquisitionSource.cardHobby;
      case 'Wecard':
        return AcquisitionSource.wecard;
      case 'Xianyu':
        return AcquisitionSource.xianyu;
      case 'Card Show':
        return AcquisitionSource.cardShow;
      case 'Alt':
        return AcquisitionSource.alt;
      case 'Fanatics':
        return AcquisitionSource.fanatics;
      case 'PWCC':
        return AcquisitionSource.pwcc;
      default:
        return AcquisitionSource.other;
    }
  }

  static String? _acquisitionSourceToString(AcquisitionSource? source) {
    if (source == null) return null;
    switch (source) {
      case AcquisitionSource.selfRip:
        return 'Self Rip (Case/Box)';
      case AcquisitionSource.breakSource:
        return 'Break';
      case AcquisitionSource.ebay:
        return 'eBay';
      case AcquisitionSource.cardHobby:
        return 'CardHobby';
      case AcquisitionSource.wecard:
        return 'Wecard';
      case AcquisitionSource.xianyu:
        return 'Xianyu';
      case AcquisitionSource.cardShow:
        return 'Card Show';
      case AcquisitionSource.alt:
        return 'Alt';
      case AcquisitionSource.fanatics:
        return 'Fanatics';
      case AcquisitionSource.pwcc:
        return 'PWCC';
      case AcquisitionSource.other:
        return 'Other';
    }
  }
}

class Stats {
  final Map<String, double> totalInvested;
  final Map<String, double> currentPortfolioValue;
  final Map<String, double> unrealizedProfit;
  final Map<String, double> realizedProfit;
  final Map<String, double> soldTotal;
  final Map<String, double> cash;
  final int cardCount;

  Stats({
    required this.totalInvested,
    required this.currentPortfolioValue,
    required this.unrealizedProfit,
    required this.realizedProfit,
    required this.soldTotal,
    required this.cash,
    required this.cardCount,
  });

  factory Stats.fromJson(Map<String, dynamic> json) {
    return Stats(
      totalInvested: Map<String, double>.from(json['totalInvested']),
      currentPortfolioValue:
          Map<String, double>.from(json['currentPortfolioValue']),
      unrealizedProfit: Map<String, double>.from(json['unrealizedProfit']),
      realizedProfit: Map<String, double>.from(json['realizedProfit']),
      soldTotal: Map<String, double>.from(json['soldTotal']),
      cash: Map<String, double>.from(json['cash']),
      cardCount: json['cardCount'],
    );
  }
}
