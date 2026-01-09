/**
 * Pet Form Component
 * 
 * Reusable form component for creating and editing pet profiles
 * Includes onBlur validation for all fields
 */

import React, { useState, useEffect } from 'react';
import './PetForm.css';

const PetForm = ({ initialData = null, onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    height: '',
    sex: '',
    allergies: '',
    triggering_point: '',
    medical_history: '',
    photo: null,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        breed: initialData.breed || '',
        age: initialData.age?.toString() || '',
        weight: initialData.weight?.toString() || '',
        height: initialData.height?.toString() || '',
        sex: initialData.sex || '',
        allergies: initialData.allergies || '',
        triggering_point: initialData.triggering_point || '',
        medical_history: initialData.medical_history || '',
        photo: null,
      });
      if (initialData.photo) {
        setPhotoPreview(initialData.photo);
      }
    }
  }, [initialData]);

  // Validation functions
  const validateName = (value) => {
    if (!value || !value.trim()) {
      return 'Pet name is required';
    }
    if (value.trim().length < 2 || value.trim().length > 100) {
      return 'Pet name must be between 2 and 100 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
      return 'Pet name can only contain letters and spaces';
    }
    return '';
  };

  const validateBreed = (value) => {
    if (!value || !value.trim()) {
      return 'Breed is required';
    }
    if (value.trim().length < 2 || value.trim().length > 100) {
      return 'Breed must be between 2 and 100 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
      return 'Breed can only contain letters and spaces';
    }
    return '';
  };

  const validateAge = (value) => {
    if (!value || value === '') {
      return 'Age is required';
    }
    const age = parseInt(value);
    if (isNaN(age) || age < 0 || age > 50) {
      return 'Age must be a number between 0 and 50';
    }
    return '';
  };

  const validateWeight = (value) => {
    if (!value || value === '') {
      return 'Weight is required';
    }
    const weight = parseFloat(value);
    if (isNaN(weight) || weight < 0.1 || weight > 999.99) {
      return 'Weight must be a number between 0.1 and 999.99 kg';
    }
    return '';
  };

  const validateHeight = (value) => {
    if (!value || value === '') {
      return 'Height is required';
    }
    const height = parseFloat(value);
    if (isNaN(height) || height < 0.1 || height > 999.99) {
      return 'Height must be a number between 0.1 and 999.99 cm';
    }
    return '';
  };

  const validateSex = (value) => {
    if (!value || !value.trim()) {
      return 'Sex is required';
    }
    if (!['Male', 'Female'].includes(value)) {
      return 'Sex must be either Male or Female';
    }
    return '';
  };

  const validateAllergies = (value) => {
    if (value && value.length > 1000) {
      return 'Allergies must not exceed 1000 characters';
    }
    if (value && !/^[a-zA-Z0-9\s,.\-()]*$/.test(value)) {
      return 'Allergies can only contain letters, numbers, spaces, and basic punctuation (,.-())';
    }
    return '';
  };

  const validateTriggeringPoint = (value) => {
    if (value && value.length > 1000) {
      return 'Triggering point must not exceed 1000 characters';
    }
    return '';
  };

  const validateMedicalHistory = (value) => {
    if (value && value.length > 5000) {
      return 'Medical history must not exceed 5000 characters';
    }
    return '';
  };

  const validatePhoto = (file) => {
    if (!initialData && !file) {
      return 'Pet photo is required';
    }
    if (file) {
      if (!file.type.startsWith('image/')) {
        return 'Only image files are allowed';
      }
      if (file.size > 5 * 1024 * 1024) {
        return 'Image size must be less than 5MB';
      }
    }
    return '';
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle blur - validate field when user leaves it
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    let error = '';
    switch (name) {
      case 'name':
        error = validateName(value);
        break;
      case 'breed':
        error = validateBreed(value);
        break;
      case 'age':
        error = validateAge(value);
        break;
      case 'weight':
        error = validateWeight(value);
        break;
      case 'height':
        error = validateHeight(value);
        break;
      case 'sex':
        error = validateSex(value);
        break;
      case 'allergies':
        error = validateAllergies(value);
        break;
      case 'triggering_point':
        error = validateTriggeringPoint(value);
        break;
      case 'medical_history':
        error = validateMedicalHistory(value);
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  // Handle photo change
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const error = validatePhoto(file);
      setErrors(prev => ({
        ...prev,
        photo: error,
      }));
      setTouched(prev => ({
        ...prev,
        photo: true,
      }));

      if (!error) {
        setFormData(prev => ({
          ...prev,
          photo: file,
        }));

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Validate all fields
  const validateAll = () => {
    const newErrors = {
      name: validateName(formData.name),
      breed: validateBreed(formData.breed),
      age: validateAge(formData.age),
      weight: validateWeight(formData.weight),
      height: validateHeight(formData.height),
      sex: validateSex(formData.sex),
      allergies: validateAllergies(formData.allergies),
      triggering_point: validateTriggeringPoint(formData.triggering_point),
      medical_history: validateMedicalHistory(formData.medical_history),
      photo: validatePhoto(formData.photo),
    };

    setErrors(newErrors);
    setTouched({
      name: true,
      breed: true,
      age: true,
      weight: true,
      height: true,
      sex: true,
      allergies: true,
      triggering_point: true,
      medical_history: true,
      photo: true,
    });

    // Check if any errors exist
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    if (!validateAll()) {
      return;
    }

    // Create FormData for multipart/form-data
    const submitData = new FormData();
    submitData.append('name', formData.name.trim());
    submitData.append('breed', formData.breed.trim());
    submitData.append('age', formData.age);
    submitData.append('weight', formData.weight);
    submitData.append('height', formData.height);
    submitData.append('sex', formData.sex);
    if (formData.allergies) submitData.append('allergies', formData.allergies.trim());
    if (formData.triggering_point) submitData.append('triggering_point', formData.triggering_point.trim());
    if (formData.medical_history) submitData.append('medical_history', formData.medical_history.trim());
    if (formData.photo) submitData.append('photo', formData.photo);

    // Call parent submit handler
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="pet-form" noValidate>
      {/* Photo Upload */}
      <div className="form-group">
        <label htmlFor="photo" className="required">
          Pet Photo
        </label>
        <input
          type="file"
          id="photo"
          name="photo"
          accept="image/*"
          onChange={handlePhotoChange}
          disabled={isLoading}
          className={touched.photo && errors.photo ? 'error' : ''}
        />
        {photoPreview && (
          <div className="photo-preview">
            <img src={photoPreview} alt="Pet preview" />
          </div>
        )}
        {touched.photo && errors.photo && (
          <span className="error-message">{errors.photo}</span>
        )}
      </div>

      {/* Name */}
      <div className="form-group">
        <label htmlFor="name" className="required">
          Pet Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          placeholder="e.g., Buddy"
          className={touched.name && errors.name ? 'error' : ''}
        />
        {touched.name && errors.name && (
          <span className="error-message">{errors.name}</span>
        )}
      </div>

      {/* Breed */}
      <div className="form-group">
        <label htmlFor="breed" className="required">
          Breed
        </label>
        <input
          type="text"
          id="breed"
          name="breed"
          value={formData.breed}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          placeholder="e.g., Golden Retriever"
          className={touched.breed && errors.breed ? 'error' : ''}
        />
        {touched.breed && errors.breed && (
          <span className="error-message">{errors.breed}</span>
        )}
      </div>

      {/* Age, Weight, Height - Row */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="age" className="required">
            Age (years)
          </label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            min="0"
            max="50"
            placeholder="e.g., 3"
            className={touched.age && errors.age ? 'error' : ''}
          />
          {touched.age && errors.age && (
            <span className="error-message">{errors.age}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="weight" className="required">
            Weight (kg)
          </label>
          <input
            type="number"
            id="weight"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            min="0.1"
            step="0.1"
            placeholder="e.g., 25.5"
            className={touched.weight && errors.weight ? 'error' : ''}
          />
          {touched.weight && errors.weight && (
            <span className="error-message">{errors.weight}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="height" className="required">
            Height (cm)
          </label>
          <input
            type="number"
            id="height"
            name="height"
            value={formData.height}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            min="0.1"
            step="0.1"
            placeholder="e.g., 60"
            className={touched.height && errors.height ? 'error' : ''}
          />
          {touched.height && errors.height && (
            <span className="error-message">{errors.height}</span>
          )}
        </div>
      </div>

      {/* Sex */}
      <div className="form-group">
        <label htmlFor="sex" className="required">
          Sex
        </label>
        <select
          id="sex"
          name="sex"
          value={formData.sex}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          className={touched.sex && errors.sex ? 'error' : ''}
        >
          <option value="">Select Sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        {touched.sex && errors.sex && (
          <span className="error-message">{errors.sex}</span>
        )}
      </div>

      {/* Allergies */}
      <div className="form-group">
        <label htmlFor="allergies">
          Allergies (Optional)
        </label>
        <textarea
          id="allergies"
          name="allergies"
          value={formData.allergies}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          rows="3"
          placeholder="e.g., Peanuts, Dairy products"
          className={touched.allergies && errors.allergies ? 'error' : ''}
        />
        {touched.allergies && errors.allergies && (
          <span className="error-message">{errors.allergies}</span>
        )}
      </div>

      {/* Triggering Point */}
      <div className="form-group">
        <label htmlFor="triggering_point">
          Triggering Point (Optional)
        </label>
        <textarea
          id="triggering_point"
          name="triggering_point"
          value={formData.triggering_point}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          rows="3"
          placeholder="e.g., Loud noises, strangers, vacuum cleaners"
          className={touched.triggering_point && errors.triggering_point ? 'error' : ''}
        />
        {touched.triggering_point && errors.triggering_point && (
          <span className="error-message">{errors.triggering_point}</span>
        )}
        <small className="help-text">
          Things that cause stress, fear, or anxiety in your pet
        </small>
      </div>

      {/* Medical History */}
      <div className="form-group">
        <label htmlFor="medical_history">
          Medical History (Optional)
        </label>
        <textarea
          id="medical_history"
          name="medical_history"
          value={formData.medical_history}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          rows="5"
          placeholder="e.g., Previous surgeries, chronic conditions, medications"
          className={touched.medical_history && errors.medical_history ? 'error' : ''}
        />
        {touched.medical_history && errors.medical_history && (
          <span className="error-message">{errors.medical_history}</span>
        )}
      </div>

      {/* Submit Button */}
      <div className="form-actions">
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Pet Profile' : 'Create Pet Profile'}
        </button>
      </div>
    </form>
  );
};

export default PetForm;
