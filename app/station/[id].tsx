import React, { useState, useMemo } from 'react';
import {
  YStack, XStack, SizableText, SafeArea, Button, AppHeader, ScrollView,
  Card, MapPin, Navigation, Share2, Heart, Divider, Badge,
  toast, Spinner, Star, Avatar, Paragraph, Input, Bell, Clock,
  AlertTriangle, CheckCircle,
} from '@blinkdotnew/mobile-ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchStations, fetchPrices, fetchFavorites, addFavorite, removeFavorite,
  fetchReviews, addReview, fetchPriceAlerts, createPriceAlert, deletePriceAlert,
} from '@/lib/blink';
import { createPriceReport } from '@/lib/priceReports';
import { Linking, Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';

function hoursAgoText(dateStr: string): string {
  const diffH = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000));
  if (diffH < 1) return "À l'instant";
  if (diffH === 1) return 'Il y a 1h';
  if (diffH < 24) return `Il y a ${diffH}h`;
  return `Il y a ${Math.floor(diffH / 24)}j`;
}

const isRecentlyConfirmed = (d: string) => (Date.now() - new Date(d).getTime()) < 3600000;
const isStationOpen = () => { const h = new Date().getHours(); return h >= 6 && h <= 22; };

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('');
  const [selectedAlertFuel, setSelectedAlertFuel] = useState('Gazole');
  const [reportingFuel, setReportingFuel] = useState<string | null>(null);
  const [reportedPrice, setReportedPrice] = useState('');

  const { data: stations } = useQuery({ queryKey: ['stations'], queryFn: fetchStations });
  const { data: prices } = useQuery({ queryKey: ['prices', id], queryFn: () => fetchPrices(id as string) });
  const { data: favorites, isLoading: loadingFavorites } = useQuery({
    queryKey: ['favorites', user?.id], queryFn: () => fetchFavorites(user?.id),
  });
  const { data: reviews, isLoading: loadingReviews } = useQuery({
    queryKey: ['reviews', id], queryFn: () => fetchReviews(id as string),
  });
  const { data: priceAlerts } = useQuery({
    queryKey: ['priceAlerts', user?.id], queryFn: () => fetchPriceAlerts(user?.id),
  });

  const inv = (key: string[]) => queryClient.invalidateQueries({ queryKey: key });

  const addReviewMutation = useMutation({
    mutationFn: (d: { rating: number; comment: string }) => addReview(id as string, d.rating, d.comment, user?.id),
    onSuccess: () => { inv(['reviews', id]); setNewReviewComment(''); setNewReviewRating(5); toast('Avis publié !', { variant: 'success' }); },
  });
  const addFavMutation = useMutation({
    mutationFn: () => addFavorite(id as string, user?.id),
    onSuccess: () => { inv(['favorites', user?.id]); toast('Ajouté aux favoris', { variant: 'success' }); },
  });
  const removeFavMutation = useMutation({
    mutationFn: () => removeFavorite(favorite!.id),
    onSuccess: () => { inv(['favorites', user?.id]); toast('Retiré des favoris'); },
  });
  const addAlertMutation = useMutation({
    mutationFn: (d: { fuelType: string; price: number }) => createPriceAlert(id as string, d.fuelType, d.price, user?.id),
    onSuccess: () => { inv(['priceAlerts', user?.id]); setAlertThreshold(''); toast('Alerte créée !', { variant: 'success' }); },
  });
  const removeAlertMutation = useMutation({
    mutationFn: (alertId: string) => deletePriceAlert(alertId),
    onSuccess: () => { inv(['priceAlerts', user?.id]); toast('Alerte supprimée'); },
  });
  const reportPriceMutation = useMutation({
    mutationFn: (d: { fuelType: string; price: number }) =>
      createPriceReport(id as string, d.fuelType, d.price, user?.id),
    onSuccess: () => { setReportingFuel(null); setReportedPrice(''); toast('Merci ! Prix signalé.', { variant: 'success' }); },
    onError: () => toast('Erreur lors du signalement', { variant: 'error' }),
  });

  const station = stations?.find((s) => s.id === id);
  const favorite = favorites?.find((f) => f.stationId === id);
  const isFavorite = !!favorite;
  const lastUpdate = useMemo(() => {
    if (!prices?.length) return null;
    return new Date(Math.max(...prices.map((p) => new Date(p.updatedAt).getTime()))).toISOString();
  }, [prices]);

  const open = isStationOpen();
  if (!station) return null;

  const stationAlerts = priceAlerts?.filter((a) => a.stationId === id) || [];

  const openInMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${station.latitude},${station.longitude}(${station.name})`,
      android: `geo:0,0?q=${station.latitude},${station.longitude}(${station.name})`,
    });
    if (url) Linking.openURL(url);
  };
  const openInWaze = () => Linking.openURL(`https://waze.com/ul?ll=${station.latitude},${station.longitude}&navigate=yes`);

  const toggleFavorite = () => {
    if (!isAuthenticated) { router.push('/auth'); return; }
    isFavorite ? removeFavMutation.mutate() : addFavMutation.mutate();
  };
  const submitReview = () => {
    if (!isAuthenticated) { router.push('/auth'); return; }
    if (!newReviewComment.trim()) { toast('Veuillez entrer un commentaire', { variant: 'error' }); return; }
    addReviewMutation.mutate({ rating: newReviewRating, comment: newReviewComment });
  };
  const submitAlert = () => {
    if (!isAuthenticated) { router.push('/auth'); return; }
    const p = parseFloat(alertThreshold.replace(',', '.'));
    if (isNaN(p) || p <= 0) { toast('Prix invalide', { variant: 'error' }); return; }
    addAlertMutation.mutate({ fuelType: selectedAlertFuel, price: p });
  };
  const submitReport = (fuelType: string) => {
    if (!isAuthenticated) { router.push('/auth'); return; }
    const p = parseFloat(reportedPrice.replace(',', '.'));
    if (isNaN(p) || p <= 0) { toast('Prix invalide', { variant: 'error' }); return; }
    reportPriceMutation.mutate({ fuelType, price: p });
  };

  const dist = (station as any).distance;
  const travelMin = dist != null ? Math.round(dist / 40 * 60) : null;

  return (
    <SafeArea flex={1} backgroundColor="$background">
      <AppHeader title={station.brand} variant="back" onBack={() => router.back()}
        rightElement={
          <XStack gap="$2">
            <Button size="$3" circular chromeless onPress={() => toast('Partagé !', { variant: 'success' })}
              icon={<Share2 size={20} color="$color11" />} />
            <Button size="$3" circular chromeless disabled={loadingFavorites} onPress={toggleFavorite}
              icon={loadingFavorites ? <Spinner size="small" /> :
                <Heart size={20} color={isFavorite ? '$red9' : '$color11'} fill={isFavorite ? '$red9' : 'transparent'} />}
            />
          </XStack>
        }
      />
      <ScrollView flex={1}>
        <YStack padding="$4" gap="$5" paddingBottom="$10">

          <YStack gap="$2">
            <SizableText size="$8" fontWeight="800" color="$color12">{station.name}</SizableText>
            <XStack gap="$2" alignItems="center">
              <MapPin size={16} color="$color9" />
              <SizableText color="$color11">{station.address}, {station.city}</SizableText>
            </XStack>
            {travelMin != null && (
              <Badge variant="outlined" paddingHorizontal="$2" alignSelf="flex-start">
                <XStack gap="$1" alignItems="center"><Navigation size={12} color="$color9" />
                  <SizableText size="$2" color="$color11">À {dist.toFixed(1)} km · ~{travelMin} min</SizableText></XStack>
              </Badge>
            )}
          </YStack>

          <Card padding="$4" backgroundColor="$color2" borderRadius="$6" elevation={2}>
            <YStack gap="$4">
              <XStack justifyContent="space-between" alignItems="center">
                <SizableText size="$5" fontWeight="700">Prix des carburants</SizableText>
                {lastUpdate && (
                  <Badge variant="outlined" paddingHorizontal="$2">
                    <XStack gap="$1" alignItems="center"><Clock size={10} color="$color9" />
                      <SizableText size="$1" color="$color9">Mis à jour {hoursAgoText(lastUpdate).toLowerCase()}</SizableText></XStack>
                  </Badge>
                )}
              </XStack>
              <YStack gap="$1">
                {prices?.map((price) => {
                  const confirmed = isRecentlyConfirmed(price.updatedAt);
                  return (
                    <YStack key={price.id}>
                      <XStack justifyContent="space-between" alignItems="center"
                        paddingVertical="$3" borderBottomWidth={1} borderBottomColor="$color3">
                        <YStack gap="$1">
                          <SizableText fontWeight="600">{price.fuelType}</SizableText>
                          {confirmed && (
                            <XStack gap="$1" alignItems="center"><CheckCircle size={10} color="$green9" />
                              <SizableText size="$1" color="$green9">Confirmé récemment</SizableText></XStack>
                          )}
                        </YStack>
                        <XStack gap="$3" alignItems="center">
                          <YStack alignItems="flex-end">
                            <SizableText size="$6" fontWeight="800" color="$color12">{price.price.toFixed(3)} €</SizableText>
                            <SizableText size="$1" color="$color9">{hoursAgoText(price.updatedAt)}</SizableText>
                          </YStack>
                          <Button size="$1" chromeless
                            onPress={() => setReportingFuel(reportingFuel === price.id ? null : price.id)}
                            icon={<AlertTriangle size={14} color="$color9" />}>
                            <SizableText size="$1" color="$color9">Signaler</SizableText>
                          </Button>
                        </XStack>
                      </XStack>
                      {reportingFuel === price.id && (
                        <YStack backgroundColor="$color1" padding="$3" borderRadius="$4"
                          borderWidth={1} borderColor="$color3" marginTop="$2" gap="$2">
                          <SizableText size="$2" color="$color11">Prix actuel affiché: {price.price.toFixed(3)} €</SizableText>
                          <XStack gap="$2">
                            <Input flex={1} size="$3" placeholder="Prix correct" keyboardType="numeric"
                              value={reportedPrice} onChangeText={setReportedPrice} />
                            <Button size="$3" variant="primary" loading={reportPriceMutation.isPending}
                              onPress={() => submitReport(price.fuelType)}>Envoyer</Button>
                          </XStack>
                        </YStack>
                      )}
                    </YStack>
                  );
                })}
              </YStack>
            </YStack>
          </Card>

          <Card padding="$4" backgroundColor="$color2" borderRadius="$6" elevation={2}>
            <YStack gap="$4">
              <XStack justifyContent="space-between" alignItems="center">
                <SizableText size="$5" fontWeight="700">Horaires d'ouverture</SizableText>
                <Badge variant={open ? 'success' : 'error'}>{open ? 'Ouvert' : 'Fermé'}</Badge>
              </XStack>
              <YStack gap="$1">
                {Object.entries(station.openingHours).map(([day, hours]) => (
                  <XStack key={day} justifyContent="space-between">
                    <SizableText color="$color11">{day}</SizableText>
                    <SizableText fontWeight="600">{hours}</SizableText>
                  </XStack>
                ))}
              </YStack>
            </YStack>
          </Card>

          <YStack gap="$4">
            <SizableText size="$5" fontWeight="700">Navigation</SizableText>
            <XStack gap="$4">
              <Button flex={1} variant="primary" icon={<Navigation size={20} />} onPress={openInMaps}>Maps</Button>
              <Button flex={1} variant="outlined" onPress={openInWaze}>Waze</Button>
            </XStack>
            {travelMin != null && (
              <SizableText size="$2" color="$color9" textAlign="center">Trajet estimé: ~{travelMin} min</SizableText>
            )}
          </YStack>

          <YStack gap="$3">
            <SizableText size="$5" fontWeight="700">Services</SizableText>
            <XStack flexWrap="wrap" gap="$2">
              {station.services.map((service, idx) => (
                <Badge key={idx} variant="outlined" paddingHorizontal="$3" paddingVertical="$1">{service}</Badge>
              ))}
            </XStack>
          </YStack>

          <Divider />

          <Card padding="$4" backgroundColor="$color2" borderRadius="$6" elevation={2}>
            <YStack gap="$4">
              <XStack justifyContent="space-between" alignItems="center">
                <SizableText size="$5" fontWeight="700">Alerte de prix</SizableText>
                <Bell size={20} color="$color9" />
              </XStack>
              {stationAlerts.length > 0 ? (
                <YStack gap="$2">
                  {stationAlerts.map((alert) => (
                    <XStack key={alert.id} justifyContent="space-between" alignItems="center"
                      backgroundColor="$color1" padding="$3" borderRadius="$4">
                      <YStack>
                        <SizableText fontWeight="600">{alert.fuelType}</SizableText>
                        <SizableText size="$2" color="$color11">Alerte si {'<'} {alert.thresholdPrice.toFixed(3)} €</SizableText>
                      </YStack>
                      <Button size="$2" variant="outlined" onPress={() => removeAlertMutation.mutate(alert.id)}>Supprimer</Button>
                    </XStack>
                  ))}
                </YStack>
              ) : (
                <SizableText size="$2" color="$color11">Soyez alerté quand le prix descend sous votre seuil.</SizableText>
              )}
              <Divider />
              <YStack gap="$3">
                <SizableText size="$3" fontWeight="600">Créer une alerte</SizableText>
                <XStack gap="$2">
                  {['Gazole', 'SP95', 'SP98', 'E10', 'E85'].slice(0, 3).map((fuel) => (
                    <Button key={fuel} size="$2" variant={selectedAlertFuel === fuel ? 'primary' : 'outline'}
                      onPress={() => setSelectedAlertFuel(fuel)}>{fuel}</Button>
                  ))}
                </XStack>
                <XStack gap="$2">
                  <Input flex={1} placeholder="Seuil (ex: 1.750)" keyboardType="numeric"
                    value={alertThreshold} onChangeText={setAlertThreshold} />
                  <Button variant="primary" icon={<Bell size={18} />} onPress={submitAlert}
                    loading={addAlertMutation.isPending}>Activer</Button>
                </XStack>
              </YStack>
            </YStack>
          </Card>

          <YStack gap="$4">
            <SizableText size="$5" fontWeight="700">Avis des utilisateurs</SizableText>
            <Card padding="$4" backgroundColor="$color2" borderRadius="$6">
              <YStack gap="$3">
                <SizableText fontWeight="600">Donner votre avis</SizableText>
                <XStack gap="$2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button key={star} circular size="$3" chromeless onPress={() => setNewReviewRating(star)}
                      icon={<Star size={20} color={star <= newReviewRating ? '$yellow9' : '$color7'}
                        fill={star <= newReviewRating ? '$yellow9' : 'transparent'} />} />
                  ))}
                </XStack>
                <Input placeholder="Votre commentaire..." multiline numberOfLines={3}
                  value={newReviewComment} onChangeText={setNewReviewComment} />
                <Button variant="primary" loading={addReviewMutation.isPending} onPress={submitReview}>Publier</Button>
              </YStack>
            </Card>
            {loadingReviews ? <Spinner /> : reviews && reviews.length > 0 ? (
              <YStack gap="$4">
                {reviews.map((review) => (
                  <Card key={review.id} padding="$4" backgroundColor="$color1" borderRadius="$4"
                    borderWidth={1} borderColor="$color3">
                    <YStack gap="$2">
                      <XStack justifyContent="space-between" alignItems="center">
                        <XStack gap="$2" alignItems="center">
                          <Avatar size="$2" circular backgroundColor="$color3"><SizableText size="$1">U</SizableText></Avatar>
                          <SizableText fontWeight="600">Utilisateur</SizableText>
                        </XStack>
                        <XStack gap="$1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={12} color={star <= review.rating ? '$yellow9' : '$color5'}
                              fill={star <= review.rating ? '$yellow9' : 'transparent'} />
                          ))}
                        </XStack>
                      </XStack>
                      <Paragraph size="$3" color="$color11">{review.comment}</Paragraph>
                      <SizableText size="$1" color="$color8">{new Date(review.createdAt).toLocaleDateString()}</SizableText>
                    </YStack>
                  </Card>
                ))}
              </YStack>
            ) : (
              <SizableText color="$color9" fontStyle="italic">Soyez le premier à donner votre avis !</SizableText>
            )}
          </YStack>

        </YStack>
      </ScrollView>
    </SafeArea>
  );
}
