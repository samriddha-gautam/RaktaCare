import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/services/firebase/config";
import { createGlobalStyles } from "@/styles/globalStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import * as Location from "expo-location";
import { haversineKm } from "@/utils/haversine";
import { useAuthStore } from "@/stores/authStore";
import { submitDonationOffer, subscribeToRequestResponses, updateDonationStatus, DonationResponse } from "@/services/firebase/donations/donationRepo";
import { BloodRequest } from "@/hooks/useBloodRequests";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const gstyles = createGlobalStyles(theme);
  const router = useRouter();
  const { user, profileData } = useAuthStore();

  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  
  const [responses, setResponses] = useState<DonationResponse[]>([]);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<{lat: number, lng: number} | null>(null);

  const isOwner = user?.uid === request?.userId;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const ref = doc(db, "bloodRequests", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError("Request not found");
          return;
        }

        const data = { id: snap.id, ...snap.data() } as BloodRequest;
        setRequest(data);
        return data;
        
        } catch (e: any) {
        setError(e.message || "Failed to load request");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
        load();
    }
  }, [id]);

  useEffect(() => {
    const fetchUserLoc = async () => {
        try {
            console.log("Locating user GPS...");
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                console.log("User GPS fetched:", loc.coords);
                setUserLocation(loc);
            } else {
                console.log("User GPS permission not granted");
            }
        } catch (err) {
            console.error("Error fetching user GPS:", err);
        }
    };

    const fetchDestinationLoc = async (locationStr: string) => {
        if (!locationStr) {
            console.log("No location string provided!");
            return;
        }
        console.log("Fetching coordinates for string location:", locationStr);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationStr)}&format=json&limit=1`, {
                headers: { "User-Agent": "RaktaCareApp/1.0" }
            });
            const data = await res.json();
            console.log("Nominatim response:", data);
            
            if (data && data.length > 0) {
                const newCoords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                console.log("Setting destination coordinates:", newCoords);
                setDestinationCoords(newCoords);
            } else {
                console.log("Nominatim found no coordinates for this location.");
                if (request?.coords?.lat) {
                    console.log("Using fallback DB coords:", request.coords);
                    setDestinationCoords({ lat: request.coords.lat, lng: request.coords.lng });
                }
            }
        } catch (e) {
            console.error("Nominatim fetch error:", e);
            if (request?.coords?.lat) {
                setDestinationCoords({ lat: request.coords.lat, lng: request.coords.lng });
            }
        }
    };

    if (request && !loading) {
       console.log("Request hydrated! Beginning map coordinate fetches...");
       fetchUserLoc();
       fetchDestinationLoc(request.location || "");
    }
  }, [request?.id, loading]);

  // Subscribe to responses if owner
  useEffect(() => {
    if (isOwner && id) {
      const unsub = subscribeToRequestResponses(id, setResponses);
      return () => unsub();
    }
  }, [isOwner, id]);

  // Delay map load to prevent thread blocking
  useEffect(() => {
    console.log("Checking map dependencies - loading:", loading, "destinationCoords:", destinationCoords);
    if (!loading && destinationCoords) {
      console.log("Triggering showMap in 600ms...");
      const timer = setTimeout(() => setShowMap(true), 600);
      return () => clearTimeout(timer);
    }
  }, [loading, destinationCoords]);

  const hasCoords = !!destinationCoords;
  const hasUserLoc = !!userLocation?.coords;
  
  // Recalculate distance dynamically once both real world points finish resolving
  useEffect(() => {
    if (hasCoords && hasUserLoc && destinationCoords) {
        const dist = haversineKm(
            { lat: userLocation.coords.latitude, lng: userLocation.coords.longitude },
            { lat: destinationCoords.lat, lng: destinationCoords.lng }
        );
        setDistance(dist);
    }
  }, [hasCoords, hasUserLoc, destinationCoords, userLocation?.coords]);

  const handleCall = (phone: string) => {
    if (!phone) return;
    const url = `tel:${phone}`;
    Linking.openURL(url).catch(() => {
        Alert.alert("Error", "Your device does not support calling.");
    });
  };

  const openGoogleMaps = () => {
    if (!destinationCoords) return;
    const label = encodeURIComponent(request?.location || "Patient Location");
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${destinationCoords.lat},${destinationCoords.lng}`,
      android: `geo:0,0?q=${destinationCoords.lat},${destinationCoords.lng}(${label})`,
    }) || `https://www.google.com/maps/search/?api=1&query=${destinationCoords.lat},${destinationCoords.lng}`;
    
    Linking.openURL(url);
  };

  const handleDonate = async () => {
    if (!user || !request || !profileData) return;

    try {
        setIsSubmittingOffer(true);
        await submitDonationOffer({
            requestId: request.id,
            donorId: user.uid,
            donorName: profileData.name || profileData.displayName || "Donor",
            donorPhone: profileData.phone || "",
            donorBloodType: profileData.bloodGroup || "",
        });
        Alert.alert("Success", "Your donation offer has been sent to the requester!");
    } catch (e: any) {
        Alert.alert("Error", e.message || "Failed to send offer.");
    } finally {
        setIsSubmittingOffer(false);
    }
  };

  const handleResponseAction = async (responseId: string, action: "accepted" | "rejected") => {
    try {
        await updateDonationStatus(responseId, action);
        Alert.alert("Updated", `Offer ${action} successfully.`);
    } catch (e: any) {
        Alert.alert("Error", e.message || "Failed to update status.");
    }
  };

  if (loading) {
    return (
      <View style={[gstyles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={[gstyles.container, styles.center]}>
        <Text style={[gstyles.text, styles.errorText]}>
          {error || "No request found"}
        </Text>
      </View>
    );
  }



  const estDriveTime = distance ? Math.round((distance / 30) * 60) : 0;

  let displayUrgency = request.urgency || "standard";
  const descLower = (request.description || "").toLowerCase();
  if (descLower.includes("icu") || descLower.includes("critical") || descLower.includes("accident") || descLower.includes("heavy bleeding")) {
      displayUrgency = "critical";
  } else if (descLower.includes("urgent") || descLower.includes("emergency") || descLower.includes("surgery") || descLower.includes("delivery")) {
      if (displayUrgency !== "critical") displayUrgency = "urgent";
  }

  return (
    <View style={[gstyles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Blood Type Hero Card */}
        <View style={styles.heroCard}>
           <Text style={styles.heroBloodType}>{request.bloodType}</Text>
           <Text style={styles.heroSubText}>Blood Type Needed</Text>
           
           <View style={styles.badgeRow}>
               <View style={styles.unitBadge}>
                  <Text style={styles.unitEmoji}>🩸</Text>
                  <Text style={styles.unitText}>{request.unitsNeeded || 1} units</Text>
               </View>

               {displayUrgency && (
                   <View style={[styles.urgencyBadge, { 
                       backgroundColor: displayUrgency === 'critical' ? '#FFF' : 'rgba(255,255,255,0.2)' 
                    }]}>
                      <Text style={[styles.urgencyText, { color: displayUrgency === 'critical' ? '#EF4444' : '#FFF' }]}>
                        {displayUrgency.toUpperCase()}
                      </Text>
                   </View>
               )}
           </View>
        </View>

        {/* Action Button for Donors */}
        {!isOwner && request.status !== "completed" && (
            <TouchableOpacity 
                style={[styles.donateButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleDonate}
                disabled={isSubmittingOffer}
            >
                {isSubmittingOffer ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={styles.donateButtonText}>I'll Donate</Text>
                )}
            </TouchableOpacity>
        )}

        {/* Responses for Requesters */}
        {isOwner && responses.length > 0 && (
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionEmoji}>🤝</Text>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Donation Offers</Text>
                </View>
                {responses.map((res) => (
                    <View key={res.id} style={styles.responseItem}>
                        <View style={styles.responseInfo}>
                            <Text style={[styles.donorName, { color: theme.colors.text }]}>{res.donorName}</Text>
                            <Text style={styles.donorMeta}>{res.donorBloodType} • {res.donorPhone}</Text>
                            <Text style={[styles.statusText, { color: res.status === 'accepted' ? '#10B981' : res.status === 'rejected' ? '#EF4444' : '#6B7280' }]}>
                                {res.status.toUpperCase()}
                            </Text>
                        </View>
                        {res.status === 'pending' && (
                            <View style={styles.actionButtons}>
                                <TouchableOpacity onPress={() => handleResponseAction(res.id, 'accepted')} style={styles.acceptBtn}>
                                    <Text style={styles.btnText}>Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleResponseAction(res.id, 'rejected')} style={styles.rejectBtn}>
                                    <Text style={styles.btnText}>Reject</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}
            </View>
        )}

        {/* Location & Route Card */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionEmoji}>📍</Text>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Location & Route</Text>
            </View>

            {hasCoords && (
                <>
                    <View style={[styles.mapWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                        {!showMap ? (
                            <>
                                <ActivityIndicator size="small" color={theme.colors.primary} />
                                <Text style={{ color: theme.colors.textSecondary, marginTop: 8, fontSize: 12 }}>Loading map...</Text>
                            </>
                        ) : mapError ? (
                            <Text style={{ color: theme.colors.danger }}>Failed to load map</Text>
                        ) : (
                            <MapView
                                style={styles.map}
                                initialRegion={{
                                    latitude: (destinationCoords!.lat + (hasUserLoc ? userLocation.coords.latitude : destinationCoords!.lat)) / 2,
                                    longitude: (destinationCoords!.lng + (hasUserLoc ? userLocation.coords.longitude : destinationCoords!.lng)) / 2,
                                    latitudeDelta: Math.abs(destinationCoords!.lat - (hasUserLoc ? userLocation.coords.latitude : destinationCoords!.lat)) * 2 + 0.02,
                                    longitudeDelta: Math.abs(destinationCoords!.lng - (hasUserLoc ? userLocation.coords.longitude : destinationCoords!.lng)) * 2 + 0.02,
                                }}
                                onMapReady={() => console.log("Map ready")}
                                onError={() => setMapError(true)}
                            >
                                <Marker coordinate={{ latitude: destinationCoords!.lat, longitude: destinationCoords!.lng }} title="Patient" pinColor="#EF4444" />
                                {hasUserLoc && (
                                    <Marker 
                                        coordinate={{ latitude: userLocation!.coords.latitude, longitude: userLocation!.coords.longitude }} 
                                        title="Me" 
                                        pinColor="#10B981" 
                                    />
                                )}
                                {hasUserLoc && (
                                    <Polyline
                                        coordinates={[
                                            { latitude: userLocation!.coords.latitude, longitude: userLocation!.coords.longitude },
                                            { latitude: destinationCoords!.lat, longitude: destinationCoords!.lng },
                                        ]}
                                        strokeColor="#EF4444"
                                        strokeWidth={3}
                                        lineDashPattern={[5, 5]}
                                    />
                                )}
                            </MapView>
                        )}
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                             <Text style={[styles.statValue, { color: theme.colors.text }]}>
                                {distance ? (distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(1)} km`) : "—"}
                             </Text>
                             <Text style={styles.statLabel}>Distance</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                             <Text style={[styles.statValue, { color: theme.colors.text }]}>{estDriveTime > 0 ? `~${estDriveTime} min` : "—"}</Text>
                             <Text style={styles.statLabel}>Est. drive time</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.mapsButton} onPress={openGoogleMaps} activeOpacity={0.8}>
                        <Text style={styles.mapsButtonEmoji}>🗺️</Text>
                        <Text style={styles.mapsButtonText}>Get Directions in Google Maps</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>

        {/* Request Info Card */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionEmoji}>🩺</Text>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Request Info</Text>
            </View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>REQUESTED BY</Text><Text style={[styles.infoValue, { color: theme.colors.text }]}>{request.userName}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>LOCATION</Text><Text style={[styles.infoValue, { color: theme.colors.text }]}>{request.location}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>CONTACT</Text>
                <TouchableOpacity onPress={() => handleCall(request.contactPhone)}>
                    <Text style={[styles.infoValue, { color: '#EF4444', textDecorationLine: 'underline' }]}>{request.contactPhone}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>DESCRIPTION</Text><Text style={[styles.infoValue, { color: theme.colors.text }]}>{request.description}</Text></View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  topHeader: { paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 16, zIndex: 10 },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 12, alignSelf: 'flex-start' },
  backButtonText: { fontSize: 16, fontWeight: "700", color: '#EF4444' },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40, marginTop: -40 },
  heroCard: { backgroundColor: '#EF4444', borderRadius: 24, padding: 30, alignItems: 'center', marginBottom: 20 },
  heroBloodType: { fontSize: 80, fontWeight: '900', color: '#FFF' },
  heroSubText: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: -5 },
  badgeRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  unitBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  unitEmoji: { marginRight: 6 },
  unitText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  urgencyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, justifyContent: 'center' },
  urgencyText: { fontSize: 12, fontWeight: '800' },
  donateButton: { marginHorizontal: 0, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  donateButtonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  sectionCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionEmoji: { fontSize: 18, marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  responseItem: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  responseInfo: { flex: 1 },
  donorName: { fontSize: 16, fontWeight: '700' },
  donorMeta: { fontSize: 13, color: '#6B7280' },
  statusText: { fontSize: 10, fontWeight: '800', marginTop: 4 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  acceptBtn: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  rejectBtn: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  mapWrapper: { height: 180, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 16 },
  map: { ...StyleSheet.absoluteFillObject },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6', marginBottom: 16 },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, height: 30, backgroundColor: '#F3F4F6' },
  mapsButton: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
  mapsButtonEmoji: { fontSize: 16, marginRight: 10 },
  mapsButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  infoRow: { marginBottom: 20 },
  infoLabel: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '700' },
  errorText: { textAlign: "center", marginTop: 20 },
});