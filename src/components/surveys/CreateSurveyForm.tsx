import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/AuthContext';
import { useEnumStore } from '@/lib/stores/enumStore';
import { surveySchema, type SurveyFormData } from '@/lib/types/survey';
import { createSurvey } from '@/lib/services/surveyService';
import { getProducts } from '@/lib/services/productService';
import { LogoUpload } from './LogoUpload';
import { ProductGrid } from './ProductGrid';
import { FormSelect } from '../ui/form-select';
import { FormInput } from '../ui/form-input';
import { Button } from '../ui/button';
import { useQuery } from '@tanstack/react-query';

export function CreateSurveyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const enums = useEnumStore((state) => state.enums);

const { data: products = [], isLoading: isLoadingProducts } = useQuery({
  queryKey: ['products', user?.id],
  queryFn: () => user ? getProducts(user.id) : Promise.resolve([]),
  enabled: !!user,
  staleTime: 0, // Don't use cached data
  cacheTime: 0  // Don't cache the result
});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema)
  });

  const selectedProductIds = watch('product_ids') || [];

  const onSubmit = async (data: SurveyFormData) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      await createSurvey(data, user.id);
      navigate('/dashboard/surveys');
    } catch (err) {
      console.error('Error creating survey:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormInput
        label="Survey Name"
        {...register('survey_name')}
        error={errors.survey_name?.message}
        placeholder="Enter survey name"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormSelect
          label="Survey Type"
          {...register('survey_style')}
          error={errors.survey_style?.message}
          options={enums?.survey_style || []}
          placeholder="Select survey type"
        />

        <FormSelect
          label="Minimum Review Length"
          {...register('minimum_review_length')}
          error={errors.minimum_review_length?.message}
          options={enums?.minimum_review_length || []}
          placeholder="Select minimum length"
        />

        <FormSelect
          label="Minimum Star Rating"
          {...register('minimum_star_rating')}
          error={errors.minimum_star_rating?.message}
          options={enums?.minimum_star_rating || []}
          placeholder="Select minimum rating"
        />

        <FormSelect
          label="Time Delay before Giveaway"
          {...register('time_delay')}
          error={errors.time_delay?.message}
          options={enums?.time_delay || []}
          placeholder="Select time delay"
        />
      </div>

      <LogoUpload
        onImageSelect={(file) => setValue('logo', file)}
        error={errors.logo?.message}
      />

      <ProductGrid
        products={products}
        selectedIds={selectedProductIds}
        onSelectionChange={(ids) => setValue('product_ids', ids)}
        error={errors.product_ids?.message}
      />

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate('/dashboard/surveys')}
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? 'Creating Survey...' : 'Create Survey'}
        </Button>
      </div>
    </form>
  );
}