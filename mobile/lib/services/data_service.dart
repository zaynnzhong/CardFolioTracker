import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/card_model.dart';

class DataService {
  // Use 10.0.2.2 for Android emulator, localhost for iOS simulator
  // TODO: Make this configurable based on environment
  static const String _baseUrl = 'http://localhost:3001/api';

  Future<Map<String, String>> _getHeaders(Future<String?> Function() getIdToken) async {
    final token = await getIdToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<List<CardModel>> getCards(Future<String?> Function() getIdToken) async {
    try {
      final headers = await _getHeaders(getIdToken);
      final response = await http.get(Uri.parse('$_baseUrl/cards'), headers: headers);

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = json.decode(response.body);
        return jsonList.map((json) => CardModel.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load cards: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching cards: $e');
      return [];
    }
  }

  Future<CardModel> saveCard(CardModel card, Future<String?> Function() getIdToken) async {
    final headers = await _getHeaders(getIdToken);
    final response = await http.post(
      Uri.parse('$_baseUrl/cards'),
      headers: headers,
      body: json.encode(card.toJson()),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return CardModel.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to save card: ${response.statusCode}');
    }
  }

  Future<void> deleteCard(String id, Future<String?> Function() getIdToken) async {
    final headers = await _getHeaders(getIdToken);
    final response = await http.delete(
      Uri.parse('$_baseUrl/cards/$id'),
      headers: headers,
    );

    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to delete card: ${response.statusCode}');
    }
  }

  Future<CardModel?> updatePrice(
    String id,
    double newPrice,
    Future<String?> Function() getIdToken, {
    String? dateStr,
    String? platform,
    String? parallel,
    String? grade,
    String? serialNumber,
  }) async {
    final headers = await _getHeaders(getIdToken);
    final body = {
      'price': newPrice,
      'date': dateStr,
      'platform': platform,
      'parallel': parallel,
      'grade': grade,
      'serialNumber': serialNumber,
    };

    final response = await http.post(
      Uri.parse('$_baseUrl/cards/$id/price'),
      headers: headers,
      body: json.encode(body),
    );

    if (response.statusCode == 200) {
      return CardModel.fromJson(json.decode(response.body));
    } else {
      return null;
    }
  }

  Future<CardModel?> deletePriceEntry(
    String id,
    String priceDate,
    Future<String?> Function() getIdToken,
  ) async {
    final headers = await _getHeaders(getIdToken);
    final encodedDate = Uri.encodeComponent(priceDate);
    final response = await http.delete(
      Uri.parse('$_baseUrl/cards/$id/price/$encodedDate'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return CardModel.fromJson(json.decode(response.body));
    } else {
      return null;
    }
  }

  Future<CardModel?> editPriceEntry(
    String id,
    String oldDate,
    double newPrice,
    Future<String?> Function() getIdToken, {
    String? newDate,
    String? platform,
    String? parallel,
    String? grade,
    String? serialNumber,
  }) async {
    final headers = await _getHeaders(getIdToken);
    final encodedDate = Uri.encodeComponent(oldDate);
    final body = {
      'price': newPrice,
      'date': newDate,
      'platform': platform,
      'parallel': parallel,
      'grade': grade,
      'serialNumber': serialNumber,
    };

    final response = await http.put(
      Uri.parse('$_baseUrl/cards/$id/price/$encodedDate'),
      headers: headers,
      body: json.encode(body),
    );

    if (response.statusCode == 200) {
      return CardModel.fromJson(json.decode(response.body));
    } else {
      return null;
    }
  }
}
