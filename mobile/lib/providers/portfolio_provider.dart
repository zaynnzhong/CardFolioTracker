import 'package:flutter/material.dart';
import '../models/card_model.dart';
import '../services/data_service.dart';

class PortfolioProvider with ChangeNotifier {
  final DataService _dataService = DataService();
  List<CardModel> _cards = [];
  bool _isLoading = false;
  Currency _displayCurrency = Currency.usd;

  List<CardModel> get cards => _cards;
  bool get isLoading => _isLoading;
  Currency get displayCurrency => _displayCurrency;

  List<CardModel> get portfolioCards => _cards.where((c) => c.watchlist != true).toList();
  List<CardModel> get watchlistCards => _cards.where((c) => c.watchlist == true).toList();

  Stats get stats {
    final initial = {'USD': 0.0, 'CNY': 0.0};
    final totalInvested = Map<String, double>.from(initial);
    final currentPortfolioValue = Map<String, double>.from(initial);
    final unrealizedProfit = Map<String, double>.from(initial);
    final realizedProfit = Map<String, double>.from(initial);
    final soldTotal = Map<String, double>.from(initial);
    final cash = Map<String, double>.from(initial);
    int cardCount = 0;

    for (var card in portfolioCards) {
      final cur = card.currency == Currency.usd ? 'USD' : 'CNY';
      final isBreakOrSelfRip = card.acquisitionSource == AcquisitionSource.breakSource ||
          card.acquisitionSource == AcquisitionSource.selfRip;

      final earliestComp = card.priceHistory.isNotEmpty
          ? card.priceHistory.first.value
          : card.purchasePrice;
      final basis = isBreakOrSelfRip ? earliestComp : card.purchasePrice;

      if (card.sold) {
        final soldPrice = card.soldPrice ?? 0;
        soldTotal[cur] = (soldTotal[cur] ?? 0) + soldPrice;

        final profit = soldPrice - basis;
        realizedProfit[cur] = (realizedProfit[cur] ?? 0) + profit;
      } else {
        cardCount++;

        if (!isBreakOrSelfRip) {
          totalInvested[cur] = (totalInvested[cur] ?? 0) + card.purchasePrice;
        }

        if (card.currentValue != -1) {
          currentPortfolioValue[cur] = (currentPortfolioValue[cur] ?? 0) + card.currentValue;
          final profit = card.currentValue - basis;
          unrealizedProfit[cur] = (unrealizedProfit[cur] ?? 0) + profit;
        }
      }
    }

    cash['USD'] = (totalInvested['USD'] ?? 0) + (realizedProfit['USD'] ?? 0);
    cash['CNY'] = (totalInvested['CNY'] ?? 0) + (realizedProfit['CNY'] ?? 0);

    return Stats(
      totalInvested: totalInvested,
      currentPortfolioValue: currentPortfolioValue,
      unrealizedProfit: unrealizedProfit,
      realizedProfit: realizedProfit,
      soldTotal: soldTotal,
      cash: cash,
      cardCount: cardCount,
    );
  }

  void setDisplayCurrency(Currency currency) {
    _displayCurrency = currency;
    notifyListeners();
  }

  Future<void> loadCards(Future<String?> Function() getIdToken) async {
    _isLoading = true;
    notifyListeners();
    try {
      _cards = await _dataService.getCards(getIdToken);
    } catch (e) {
      print('Error loading cards: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addCard(CardModel card, Future<String?> Function() getIdToken) async {
    try {
      final newCard = await _dataService.saveCard(card, getIdToken);
      _cards.add(newCard);
      notifyListeners();
    } catch (e) {
      print('Error adding card: $e');
      rethrow;
    }
  }

  Future<void> updateCard(CardModel card, Future<String?> Function() getIdToken) async {
    try {
      final updatedCard = await _dataService.saveCard(card, getIdToken);
      final index = _cards.indexWhere((c) => c.id == updatedCard.id);
      if (index != -1) {
        _cards[index] = updatedCard;
        notifyListeners();
      }
    } catch (e) {
      print('Error updating card: $e');
      rethrow;
    }
  }

  Future<void> deleteCard(String id, Future<String?> Function() getIdToken) async {
    try {
      await _dataService.deleteCard(id, getIdToken);
      _cards.removeWhere((c) => c.id == id);
      notifyListeners();
    } catch (e) {
      print('Error deleting card: $e');
      rethrow;
    }
  }
}
