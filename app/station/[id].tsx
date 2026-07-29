import React, { useState } from 'react';
import { YStack, XStack, SizableText, SafeArea, Button, AppHeader, ScrollView, Card, MapPin, Navigation, Share2, Heart, Divider, Badge, useTheme, toast, Spinner, Star, Avatar, Paragraph, Input, Bell } from '@blinkdotnew/mobile-ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStations, fetchPrices, fetchFavorites, addFavorite, removeFavorite, fetchReviews, addReview, fetchPriceAlerts, createPriceAlert, deletePriceAlert } from '@/lib/blink';
import { Linking, Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('');
  const [selectedAlertFuel, setSelectedAlertFuel] = useState('Gazole');

  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: fetchStations,
  });

  const { data: prices } = useQuery({
    queryKey: ['prices', id],
    queryFn: () => fetchPrices(id as string),
  });

  const { data: favorites, isLoading: loadingFavorites } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => fetchFavorites(user?.id),
  });

  const { data: reviews, isLoading: loadingReviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => fetchReviews(id as string),
  });

  const { data: priceAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['priceAlerts', user?.id],
    queryFn: () => fetchPriceAlerts(user?.id),
  });

  const addReviewMutation = useMutation({
    mutationFn: (data: { rating: number, comment: string }) => addReview(id as string, data.rating, data.comment, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      setNewReviewComment('');
      setNewReviewRating(5);
      toast('Avis publié !', { variant: 'success' });
    },
  });

  const station = stations?.find(s => s.id === id);
  const favorite = favorites?.find(f => f.stationId === id);
  const isFavorite = !!favorite;

  const addFavMutation = useMutation({
    mutationFn: () => addFavorite(id as string, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      toast('Ajouté aux favoris', { variant: 'success' });
    },
  });

  const removeFavMutation = useMutation({
    mutationFn: () => removeFavorite(favorite!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      toast('Retiré des favoris');
    },
  });

  const addAlertMutation = useMutation({
    mutationFn: (data: { fuelType: string, price: number }) => createPriceAlert(id as string, data.fuelType, data.price, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceAlerts', user?.id] });
      setAlertThreshold('');
      toast('Alerte créée !', { variant: 'success' });
    },
  });

  const removeAlertMutation = useMutation({
    mutationFn: (alertId: string) => deletePriceAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceAlerts', user?.id] });
      toast('Alerte supprimée');
    },
  });

  if (!station) return null;

  const stationAlerts = priceAlerts?.filter(a => a.stationId === id) || [];

  const openInMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${station.latitude},${station.longitude}(${station.name})`,
      android: `geo:0,0?q=${station.latitude},${station.longitude}(${station.name})`,
    });
    if (url) Linking.openURL(url);
  };

  const openInWaze = () => {
    const url = `https://waze.com/ul?ll=${station.latitude},${station.longitude}&navigate=yes`;
    Linking.openURL(url);
  };

  const onShare = () => {
    toast('Partagé !', { variant: 'success' });
  };

  const toggleFavorite = () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    if (isFavorite) {
      removeFavMutation.mutate();
    } else {
      addFavMutation.mutate();
    }
  };

  const handleAddReview = () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    if (!newReviewComment.trim()) {
      toast('Veuillez entrer un commentaire', { variant: 'error' });
      return;
    }
    addReviewMutation.mutate({ rating: newReviewRating, comment: newReviewComment });
  };

  const handleAddAlert = () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    const price = parseFloat(alertThreshold.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      toast('Prix invalide', { variant: 'error' });
      return;
    }
    addAlertMutation.mutate({ fuelType: selectedAlertFuel, price });
  };

  return (
    <SafeArea flex={1} backgroundColor="$background">
      <AppHeader 
        title={station.brand} 
        variant="back" 
        onBack={() => router.back()}
        rightElement={
          <XStack gap="$2">
            <Button size="$3" circular onPress={onShare} chromeless icon={<Share2 size={20} color="$color11" />} />
            <Button 
              size="$3" 
              circular 
              onPress={toggleFavorite} 
              chromeless 
              disabled={loadingFavorites}
              icon={
                loadingFavorites ? (
                  <Spinner size="small" />
                ) : (
                  <Heart 
                    size={20} 
                    color={isFavorite ? '$red9' : '$color11'} 
                    fill={isFavorite ? '$red9' : 'transparent'} 
                  />
                )
              } 
            />
          </XStack>
        }
      />

      <ScrollView flex={1}>
        <YStack padding="$4" gap="$6" paddingBottom="$10">
          <YStack gap="$2">
            <SizableText size="$8" fontWeight="800" color="$color12">{station.name}</SizableText>
            <XStack gap="$2" alignItems="center">
              <MapPin size={16} color="$color9" />
              <SizableText color="$color11">{station.address}, {station.city}</SizableText>
            </XStack>
          </YStack>

          <Card padding="$4" backgroundColor="$color2" borderRadius="$6" elevation={2}>
            <YStack gap="$4">
              <SizableText size="$5" fontWeight="700">Prix des carburants</SizableText>
              <YStack gap="$2">
                {prices?.map((price) => (
                  <XStack key={price.id} justifyContent="space-between" alignItems="center" paddingVertical="$2" borderBottomWidth={1} borderBottomColor="$color3">
                    <SizableText fontWeight="600">{price.fuelType}</SizableText>
                    <XStack gap="$2" alignItems="center">
                      <SizableText size="$6" fontWeight="800" color="$color12">{price.price.toFixed(3)} €</SizableText>
                      <SizableText size="$2" color="$color9">Il y a 2h</SizableText>
                    </XStack>
                  </XStack>
                ))}
              </YStack>
            </YStack>
          </Card>

          <Card padding="$4" backgroundColor="$color2" borderRadius="$6" elevation={2}>
            <YStack gap="$4">
              <SizableText size="$5" fontWeight="700">Horaires d'ouverture</SizableText>
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
              <Button flex={1} variant="primary" icon={<Navigation size={20} />} onPress={openInMaps}>
                Maps
              </Button>
              <Button flex={1} variant="outline" onPress={openInWaze}>
                Waze
              </Button>
            </XStack>
          </YStack>

          <YStack gap="$4">
            <SizableText size="$5" fontWeight="700">Services</SizableText>
            <XStack flexWrap="wrap" gap="$2">
              {station.services.map((service, idx) => (
                <Badge key={idx} variant="outline" paddingHorizontal="$3" paddingVertical="$1">
                  {service}
                </Badge>
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
                  {stationAlerts.map(alert => (
                    <XStack key={alert.id} justifyContent="space-between" alignItems="center" backgroundColor="$color1" padding="$3" borderRadius="$4">
                      <YStack>
                        <SizableText fontWeight="600">{alert.fuelType}</SizableText>
                        <SizableText size="$2" color="$color11">Alerte si {'<'} {alert.thresholdPrice.toFixed(3)} €</SizableText>
                      </YStack>
                      <Button size="$2" variant="outline" onPress={() => removeAlertMutation.mutate(alert.id)}>Supprimer</Button>
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
                  {['Gazole', 'SP95', 'SP98', 'E10', 'E85'].slice(0, 3).map(fuel => (
                    <Button 
                      key={fuel} 
                      size="$2" 
                      variant={selectedAlertFuel === fuel ? 'primary' : 'outline'}
                      onPress={() => setSelectedAlertFuel(fuel)}
                    >
                      {fuel}
                    </Button>
                  ))}
                </XStack>
                <XStack gap="$2">
                  <Input 
                    flex={1}
                    placeholder="Seuil (ex: 1.750)" 
                    keyboardType="numeric"
                    value={alertThreshold}
                    onChangeText={setAlertThreshold}
                  />
                  <Button variant="primary" icon={<Bell size={18} />} onPress={handleAddAlert} loading={addAlertMutation.isPending}>
                    Activer
                  </Button>
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
                  {[1, 2, 3, 4, 5].map(star => (
                    <Button 
                      key={star} 
                      circular 
                      size="$3" 
                      chromeless 
                      onPress={() => setNewReviewRating(star)}
                      icon={<Star size={20} color={star <= newReviewRating ? '$yellow9' : '$color7'} fill={star <= newReviewRating ? '$yellow9' : 'transparent'} />}
                    />
                  ))}
                </XStack>
                <Input 
                  placeholder="Votre commentaire..." 
                  multiline 
                  numberOfLines={3} 
                  value={newReviewComment}
                  onChangeText={setNewReviewComment}
                />
                <Button variant="primary" loading={addReviewMutation.isPending} onPress={handleAddReview}>
                  Publier
                </Button>
              </YStack>
            </Card>

            {loadingReviews ? (
              <Spinner />
            ) : reviews && reviews.length > 0 ? (
              <YStack gap="$4">
                {reviews.map((review) => (
                  <Card key={review.id} padding="$4" backgroundColor="$color1" borderRadius="$4" borderWidth={1} borderColor="$color3">
                    <YStack gap="$2">
                      <XStack justifyContent="space-between" alignItems="center">
                        <XStack gap="$2" alignItems="center">
                          <Avatar size="$2" circular backgroundColor="$color3">
                            <SizableText size="$1">U</SizableText>
                          </Avatar>
                          <SizableText fontWeight="600">Utilisateur</SizableText>
                        </XStack>
                        <XStack gap="$1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} size={12} color={star <= review.rating ? '$yellow9' : '$color5'} fill={star <= review.rating ? '$yellow9' : 'transparent'} />
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