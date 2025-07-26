import unittest
import json
from unittest.mock import patch, MagicMock
import sys
import os

# Add the parent directory to the path so we can import the app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app

class TestApp(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        
    def test_calculate_cex_valid_data(self):
        """Test the calculate_cex endpoint with valid data"""
        # Test data
        test_data = {
            'Sp': 8.0, 'Ac': 7.0, 'Da': 9.0, 'Zl': 6.0,  # Comfort
            'To': 8.0, 'Ng': 7.0, 'Rt': 9.0, 'Pm': 6.0,  # Efficiency
            'Va': 8.0, 'Id': 7.0, 'Sc': 9.0, 'Lu': 6.0,  # Aesthetics
            'iata': 'GRU', 'airport': 'São Paulo/Guarulhos'
        }
        
        # Mock the send_cex_evaluation function to avoid actual API calls
        with patch('utils.send.send_cex_evaluation') as mock_send:
            # Make the request
            response = self.app.post('/calculate_cex', 
                                    data=json.dumps(test_data),
                                    content_type='application/json')
            
            # Check that the response is OK
            self.assertEqual(response.status_code, 200)
            
            # Parse the response data
            data = json.loads(response.data)
            
            # Check the calculated values
            self.assertEqual(data['IATA'], 'GRU')
            self.assertEqual(data['Airport'], 'São Paulo/Guarulhos')
            
            # Calculate expected values
            expected_C = (8.0 + 7.0 + 9.0 + 6.0) / 4
            expected_E = (8.0 + 7.0 + 9.0 + 6.0) / 4
            expected_X = (8.0 + 7.0 + 9.0 + 6.0) / 4
            expected_CEX = (expected_C + expected_E + expected_X) / 3
            
            # Check that the calculated values match the expected values
            self.assertAlmostEqual(data['C'], round(expected_C, 2))
            self.assertAlmostEqual(data['E'], round(expected_E, 2))
            self.assertAlmostEqual(data['X'], round(expected_X, 2))
            self.assertAlmostEqual(data['CEX'], round(expected_CEX, 2))
            
            # Check that send_cex_evaluation was called with the correct data
            mock_send.assert_called_once_with(test_data)
    
    def test_calculate_cex_missing_field(self):
        """Test the calculate_cex endpoint with missing field"""
        # Test data with missing field
        test_data = {
            'Sp': 8.0, 'Ac': 7.0, 'Da': 9.0,  # Missing Zl
            'To': 8.0, 'Ng': 7.0, 'Rt': 9.0, 'Pm': 6.0,
            'Va': 8.0, 'Id': 7.0, 'Sc': 9.0, 'Lu': 6.0,
            'iata': 'GRU', 'airport': 'São Paulo/Guarulhos'
        }
        
        # Make the request
        response = self.app.post('/calculate_cex', 
                                data=json.dumps(test_data),
                                content_type='application/json')
        
        # Check that the response is a 400 Bad Request
        self.assertEqual(response.status_code, 400)
        
        # Parse the response data
        data = json.loads(response.data)
        
        # Check the error message
        self.assertIn('error', data)
        self.assertIn('Missing field', data['error'])
    
    def test_calculate_cex_server_error(self):
        """Test the calculate_cex endpoint with server error"""
        # Test data
        test_data = {
            'Sp': 8.0, 'Ac': 7.0, 'Da': 9.0, 'Zl': 6.0,
            'To': 8.0, 'Ng': 7.0, 'Rt': 9.0, 'Pm': 6.0,
            'Va': 8.0, 'Id': 7.0, 'Sc': 9.0, 'Lu': 6.0,
            'iata': 'GRU', 'airport': 'São Paulo/Guarulhos'
        }
        
        # Mock the send_cex_evaluation function to raise an exception
        with patch('utils.send.send_cex_evaluation') as mock_send:
            mock_send.side_effect = Exception('Test exception')
            
            # Make the request
            response = self.app.post('/calculate_cex', 
                                    data=json.dumps(test_data),
                                    content_type='application/json')
            
            # Check that the response is a 500 Internal Server Error
            self.assertEqual(response.status_code, 500)
            
            # Parse the response data
            data = json.loads(response.data)
            
            # Check the error message
            self.assertIn('error', data)

if __name__ == '__main__':
    unittest.main()