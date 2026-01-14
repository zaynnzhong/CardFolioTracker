import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/portfolio_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/card_list_item.dart';
import '../widgets/dashboard_stats.dart';
import 'card_detail_screen.dart';
import 'card_form_screen.dart';

class PortfolioScreen extends StatefulWidget {
  const PortfolioScreen({super.key});

  @override
  State<PortfolioScreen> createState() => _PortfolioScreenState();
}

class _PortfolioScreenState extends State<PortfolioScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      Provider.of<PortfolioProvider>(context, listen: false).loadCards(authProvider.getIdToken);
    });
  }

  @override
  Widget build(BuildContext context) {
    final portfolioProvider = Provider.of<PortfolioProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Portfolio'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const CardFormScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              Provider.of<AuthProvider>(context, listen: false).signOut();
            },
          ),
        ],
      ),
      body: portfolioProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                DashboardStats(
                  stats: portfolioProvider.stats,
                  displayCurrency: portfolioProvider.displayCurrency,
                ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    itemCount: portfolioProvider.portfolioCards.length,
                    itemBuilder: (context, index) {
                      final card = portfolioProvider.portfolioCards[index];
                      return GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => CardDetailScreen(card: card),
                            ),
                          );
                        },
                        child: CardListItem(card: card),
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }
}
