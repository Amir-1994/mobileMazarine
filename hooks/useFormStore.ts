import { Asset, Driver, Bac, FormData, Location } from '@/types/api';

import { useState } from 'react';

export const useFormStore = () => {
  const [formData, setFormData] = useState<FormData>({
    selectedAsset: null,
    selectedDriver: null,
    selectedBac: null,
    photo: null,
    description: '',
    location: null,
  });

  const updateAsset = (asset: Asset | null) => {
    setFormData(prev => ({ ...prev, selectedAsset: asset }));
  };

  const updateDriver = (driver: Driver | null) => {
    setFormData(prev => ({ ...prev, selectedDriver: driver }));
  };

  const updateBac = (bac: Bac | null) => {
    setFormData(prev => ({ ...prev, selectedBac: bac }));
  };

  const updatePhoto = (photo: string | null) => {
    setFormData(prev => ({ ...prev, photo }));
  };

  const updateDescription = (description: string) => {
    setFormData(prev => ({ ...prev, description }));
  };

  const updateLocation = (location: Location | null) => {
    setFormData(prev => ({ ...prev, location }));
  };

  const resetForm = () => {
    setFormData({
      selectedAsset: null,
      selectedDriver: null,
      selectedBac: null,
      photo: null,
      description: '',
      location: null,
    });
  };

  const isFormValid = () => {
    return formData.selectedAsset && 
           formData.selectedDriver && 
           formData.selectedBac && 
           formData.description.trim().length > 0 &&
           formData.location;
  };

  return {
    formData,
    updateAsset,
    updateDriver,
    updateBac,
    updatePhoto,
    updateDescription,
    updateLocation,
    resetForm,
    isFormValid,
  };
};