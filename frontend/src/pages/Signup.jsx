/**
 * Signup Page
 * 
 * User registration form with validation
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { registerUser } from '../services/api';
import { toast } from 'react-toastify';
import { getPasswordStrength } from '../utils/auth';
import SuccessModal from '../app/components/ui/SuccessModal';

// Validation schema
const SignupSchema = Yup.object().shape({
  first_name: Yup.string()
    .min(2, 'Too short')
    .max(50, 'Too long')
    .required('First name is required'),
  last_name: Yup.string()
    .min(2, 'Too short')
    .max(50, 'Too long')
    .required('Last name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phone_number: Yup.string()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Invalid phone number')
    .nullable(),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Za-z]/, 'Password must contain at least one letter')
    .matches(/\d/, 'Password must contain at least one number')
    .required('Password is required'),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  user_type: Yup.string()
    .oneOf(['pet_owner', 'admin', 'staff'], 'Invalid user type')
    .required('User type is required'),
  terms: Yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions')
    .required('You must accept the terms and conditions'),
});

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'None', color: '#ccc' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const initialValues = {
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    user_type: 'pet_owner',
    terms: false,
  };

  const handlePasswordChange = (value) => {
    const strength = getPasswordStrength(value);
    setPasswordStrength(strength);
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    console.log('🚀 Form submitted!', values);
    console.log('🔍 Validation state:', { isSubmitting: false, values });
    
    try {
      const { terms, first_name, last_name, phone_number, confirm_password, user_type, ...rest } = values;
      
      // Transform field names to camelCase for backend
      const userData = {
        ...rest,
        firstName: first_name,
        lastName: last_name,
        phoneNumber: phone_number,
        confirmPassword: confirm_password,
        userType: user_type
      };
      
      console.log('📤 Sending registration data:', userData);
      
      const response = await registerUser(userData);
      console.log('✅ Registration response:', response);

      if (response.success) {
        console.log('🎉 Registration successful! Showing success modal...');
        setRegisteredEmail(userData.email);
        setShowSuccessModal(true);
      } else {
        console.warn('⚠️ Registration response success=false:', response);
        toast.error(response.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error.errors) {
        // Transform backend errors back to snake_case for form fields
        const formErrors = {};
        Object.keys(error.errors).forEach(key => {
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          formErrors[snakeKey] = error.errors[key];
        });
        console.log('📝 Setting form errors:', formErrors);
        setErrors(formErrors);
      }
      
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
      console.log('✅ Form submission complete');
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/login', { state: { email: registeredEmail, registered: true } });
  };

  return (
    <div className="auth-page">
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Success"
        message="Registration successful!"
        actionText="OK"
        autoRedirectSeconds={3}
      />
      
      <div className="signup-container">
        {/* Left Side - Image and Text */}
        <div className="signup-left">
          <div className="signup-brand">
            <div className="auth-logo">
              <span className="paw-icon">🐾</span>
              <span className="logo-text">PawWell</span>
            </div>
          </div>
          
          <h1 className="signup-heading">Join the PawWell<br />Family!</h1>
          <p className="signup-description">
            Create an account to manage your pets,<br />book services, and get expert advice.
          </p>
          
          <div className="signup-image">
            <div className="pet-image-circle">
              🐕
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="signup-right">
          <div className="signup-form-container">
            
            <Formik
              initialValues={initialValues}
              validationSchema={SignupSchema}
              onSubmit={handleSubmit}
            >
              {({ values, isSubmitting, setFieldValue, errors, touched }) => {
                console.log('🎨 Formik render - isSubmitting:', isSubmitting, 'errors:', errors);
                return (
              <Form className="auth-form" onSubmit={(e) => {
                console.log('📝 Form onSubmit event triggered');
              }}>
                <div className="form-group">
                  <label htmlFor="first_name">Full Name</label>
                  <div className="name-fields">
                    <Field name="first_name">
                      {({ field, meta }) => (
                        <input
                          {...field}
                          type="text"
                          id="first_name"
                          placeholder="John Doe"
                          className={`auth-input ${meta.touched && meta.error ? 'input-error' : ''}`}
                          onChange={(e) => {
                            const fullName = e.target.value;
                            setFieldValue('first_name', fullName);
                            // Auto-populate last_name from full name
                            const nameParts = fullName.trim().split(' ');
                            if (nameParts.length > 1) {
                              setFieldValue('last_name', nameParts.slice(1).join(' '));
                            } else {
                              setFieldValue('last_name', 'User');
                            }
                          }}
                        />
                      )}
                    </Field>
                  </div>
                  <ErrorMessage name="first_name" component="div" className="error-message" />
                </div>

                <div className="form-group" style={{ display: 'none' }}>
                  <Field
                    type="text"
                    name="last_name"
                    id="last_name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <Field name="email">
                    {({ field, meta }) => (
                      <input
                        {...field}
                        type="email"
                        id="email"
                        placeholder="john.doe@example.com"
                        className={`auth-input ${meta.touched && meta.error ? 'input-error' : ''}`}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="email" component="div" className="error-message" />
                </div>

                <div className="form-group">
                  <label htmlFor="phone_number">Phone Number</label>
                  <Field name="phone_number">
                    {({ field, meta }) => (
                      <input
                        {...field}
                        type="tel"
                        id="phone_number"
                        placeholder="(123) 456-7890"
                        className={`auth-input ${meta.touched && meta.error ? 'input-error' : ''}`}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="phone_number" component="div" className="error-message" />
                </div>

                <div className="form-group" style={{ display: 'none' }}>
                  <Field as="select" name="user_type" id="user_type">
                    <option value="pet_owner">Pet Owner</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </Field>
                  <ErrorMessage name="user_type" component="div" className="error-message" />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-with-icon">
                    <Field name="password">
                      {({ field }) => (
                        <input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          placeholder="••••••••"
                          className="auth-input"
                          onChange={(e) => {
                            setFieldValue('password', e.target.value);
                            handlePasswordChange(e.target.value);
                          }}
                        />
                      )}
                    </Field>
                    <button
                      type="button"
                      className="toggle-password-icon"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️'}
                    </button>
                  </div>
                  {values.password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div
                          className="strength-fill"
                          style={{
                            width: `${(passwordStrength.score / 6) * 100}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        ></div>
                      </div>
                      <span className="strength-label" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                  <ErrorMessage name="password" component="div" className="error-message" />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm_password">Confirm Password</label>
                  <div className="input-with-icon">
                    <Field name="confirm_password">
                      {({ field, meta }) => (
                        <input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirm_password"
                          placeholder="••••••••"
                          className={`auth-input ${meta.touched && meta.error ? 'input-error' : ''}`}
                        />
                      )}
                    </Field>
                    <button
                      type="button"
                      className="toggle-password-icon"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? '👁️' : '👁️'}
                    </button>
                  </div>
                  <ErrorMessage name="confirm_password" component="div" className="error-message" />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <Field name="terms">
                      {({ field }) => (
                        <input
                          type="checkbox"
                          {...field}
                          checked={field.value}
                          onChange={(e) => {
                            setFieldValue('terms', e.target.checked);
                          }}
                        />
                      )}
                    </Field>
                    <span>
                      I agree to the{' '}
                      <Link to="/terms" target="_blank" className="link-highlight">
                        Terms & Conditions
                      </Link>
                    </span>
                  </label>
                  <ErrorMessage name="terms" component="div" className="error-message" />
                </div>

                <button
                  type="submit"
                  className="btn-auth-primary"
                  disabled={isSubmitting}
                  onClick={() => console.log('🖱️ Register button clicked!')}
                >
                  {isSubmitting ? 'Creating Account...' : 'Register Account'}
                </button>

                <div className="divider">
                  <span>OR</span>
                </div>

                <button type="button" className="btn-google">
                  <span className="google-icon">🌐</span>
                  Sign up with Google
                </button>
              </Form>
            );
              }}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
