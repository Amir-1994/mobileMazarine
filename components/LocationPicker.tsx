import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ExpoLocation from 'expo-location';
import { MapPin, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react-native';
import { Location } from '@/types/api';

interface LocationPickerProps {
  value: Location | null;
  onLocationSelect: (location: Location | null) => void;
  placeholder?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onLocationSelect,
  placeholder = "Obtenir la géolocalisation",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocationPermission = async () => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission de géolocalisation refusée');
        if (Platform.OS !== 'web') {
          Alert.alert(
            'Permission requise',
            'L\'application a besoin d\'accéder à votre position pour fonctionner correctement.',
            [{ text: 'OK' }]
          );
        }
        return false;
      }
      return true;
    } catch {
      setError('Erreur lors de la demande de permission');
      return false;
    }
  };

  const getCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      // Web geolocation fallback
      if (!navigator.geolocation) {
        setError('Géolocalisation non supportée sur ce navigateur');
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || undefined,
            timestamp: Date.now(),
          };
          onLocationSelect(location);
          setIsLoading(false);
        },
        (geoError) => {
          const errorMessage = geoError?.message || 'Erreur de géolocalisation';
          if (errorMessage.trim().length > 0 && errorMessage.length <= 200) {
            setError('Impossible d\'obtenir la position');
            console.error('Geolocation error:', errorMessage);
          } else {
            setError('Impossible d\'obtenir la position');
          }
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        }
      );
      return;
    }

    // Native geolocation
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setIsLoading(true);
    setError(null);

    try {
      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 1,
      });

      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || undefined,
        timestamp: Date.now(),
      };

      // Try to get address (optional)
      try {
        const reverseGeocode = await ExpoLocation.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          location.address = `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim();
        }
      } catch (geocodeError) {
        console.log('Reverse geocoding failed:', geocodeError);
      }

      onLocationSelect(location);
    } catch (err) {
      setError('Impossible d\'obtenir la position');
      console.error('Location error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLocation = () => {
    onLocationSelect(null);
    setError(null);
  };

  const formatCoordinates = (location: Location) => {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      {!value ? (
        <TouchableOpacity
          style={[styles.button, error && styles.buttonError]}
          onPress={getCurrentLocation}
          disabled={isLoading}
        >
          <View style={styles.buttonContent}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#4a90e2" />
            ) : error ? (
              <AlertCircle size={20} color="#ff4757" />
            ) : (
              <MapPin size={20} color="#4a90e2" />
            )}
            <Text style={[styles.buttonText, error && styles.buttonTextError]}>
              {isLoading ? 'Localisation en cours...' : error || placeholder}
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.locationContainer}>
          <View style={styles.locationHeader}>
            <View style={styles.locationIcon}>
              <CheckCircle size={20} color="#4CAF50" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Position obtenue</Text>
              <Text style={styles.locationCoords}>
                {formatCoordinates(value)}
              </Text>
              {value.address && (
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {value.address}
                </Text>
              )}
              <Text style={styles.locationTime}>
                {formatTimestamp(value.timestamp)}
              </Text>
              {value.accuracy && (
                <Text style={styles.locationAccuracy}>
                  Précision: ±{Math.round(value.accuracy)}m
                </Text>
              )}
            </View>
          </View>
          <View style={styles.locationActions}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={getCurrentLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#4a90e2" />
              ) : (
                <RefreshCw size={16} color="#4a90e2" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearLocation}
            >
              <Text style={styles.clearButtonText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    borderWidth: 2,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    backgroundColor: '#fff',
    borderStyle: 'dashed',
  },
  buttonError: {
    borderColor: '#ff4757',
    backgroundColor: '#fff5f5',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    color: '#4a90e2',
    fontWeight: '500',
  },
  buttonTextError: {
    color: '#ff4757',
  },
  locationContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
    color: '#4a90e2',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  locationAccuracy: {
    fontSize: 12,
    color: '#999',
  },
  locationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: '#ff4757',
    fontSize: 14,
    fontWeight: '500',
  },
});