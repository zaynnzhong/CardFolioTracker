import 'package:flutter/material.dart';
import '../models/card_model.dart';

class DashboardStats extends StatelessWidget {
  final Stats stats;
  final Currency displayCurrency;

  const DashboardStats({
    super.key,
    required this.stats,
    required this.displayCurrency,
  });

  String get _currencySymbol => displayCurrency == Currency.usd ? '\$' : '¥';
  String get _currencyKey => displayCurrency == Currency.usd ? 'USD' : 'CNY';

  @override
  Widget build(BuildContext context) {
    final totalValue = stats.currentPortfolioValue[_currencyKey] ?? 0;
    final totalInvested = stats.totalInvested[_currencyKey] ?? 0;
    final unrealized = stats.unrealizedProfit[_currencyKey] ?? 0;
    final realized = stats.realizedProfit[_currencyKey] ?? 0;
    final returnPercentage = totalInvested > 0 ? (unrealized / totalInvested) * 100 : 0.0;

    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B), // Slate-800
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Portfolio Value',
            style: TextStyle(color: Colors.grey, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$_currencySymbol${totalValue.toStringAsFixed(2)}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: returnPercentage >= 0
                      ? const Color(0xFF10B981).withOpacity(0.2)
                      : const Color(0xFFEF4444).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      returnPercentage >= 0 ? Icons.arrow_upward : Icons.arrow_downward,
                      size: 16,
                      color: returnPercentage >= 0
                          ? const Color(0xFF10B981)
                          : const Color(0xFFEF4444),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${returnPercentage.abs().toStringAsFixed(1)}%',
                      style: TextStyle(
                        color: returnPercentage >= 0
                            ? const Color(0xFF10B981)
                            : const Color(0xFFEF4444),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildStatItem('Invested', totalInvested),
              _buildStatItem('Unrealized', unrealized, colorize: true),
              _buildStatItem('Realized', realized, colorize: true),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, double value, {bool colorize = false}) {
    Color valueColor = Colors.white;
    if (colorize) {
      if (value > 0) valueColor = const Color(0xFF10B981);
      if (value < 0) valueColor = const Color(0xFFEF4444);
    }

    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(color: Colors.grey, fontSize: 12),
          ),
          const SizedBox(height: 2),
          Text(
            '$_currencySymbol${value.abs().toStringAsFixed(0)}',
            style: TextStyle(
              color: valueColor,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
