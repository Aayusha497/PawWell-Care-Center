/**
 * Signup Page
 * 
 * User registration form with validation
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { registerUser } from '../services/api';
import { toast } from 'react-toastify';
import { getPasswordStrength } from '../utils/auth';
import Swal from "sweetalert2";
import { SignupValidationSchema } from '../utils/formValidation';

const Signup = () => {

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: 'None',
    color: '#ccc'
  });

  const initialValues = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    user_type: 'pet_owner',
    terms: false,
  };

  const handlePasswordChange = (value) => {
    const strength = getPasswordStrength(value);
    setPasswordStrength(strength);
  };


  const handleSubmit = async (values, { setSubmitting, setErrors, setTouched }) => {

    console.log('🚀 Form submitted!', values);
    console.log('⚠️ CRITICAL: Performing STRICT validation on BOTH first_name and last_name');

    // Mark all fields as touched to show validation errors
    const allFields = Object.keys(values);
    const touchedFields = {};
    allFields.forEach(field => {
      touchedFields[field] = true;
    });
    setTouched(touchedFields);

    // ============================================
    // STRICT FIRST NAME VALIDATION - NO EXCEPTIONS
    // ============================================
    const firstName = values.first_name.trim();
    console.log('🔍 Validating first_name:', firstName);

    if (!firstName) {
      console.error('❌ REJECTED: Empty first name');
      setErrors({ first_name: 'First name is required.' });
      toast.error('❌ First name is required.');
      setSubmitting(false);
      return;
    }

    if (firstName.length < 2) {
      console.error('❌ REJECTED: First name too short:', firstName);
      setErrors({ first_name: 'First name must be at least 2 characters long.' });
      toast.error('❌ First name must be at least 2 characters long.');
      setSubmitting(false);
      return;
    }

    // CHECK FOR NUMBERS IN FIRST NAME - ZERO TOLERANCE
    if (/\d/.test(firstName)) {
      console.error('❌❌❌ REJECTED: Numbers found in first name:', firstName);
      setErrors({ first_name: 'First name should contain only letters (A–Z). Numbers are NOT allowed.' });
      toast.error('❌ First name CANNOT contain numbers. Please use only letters.');
      setSubmitting(false);
      return;
    }

    // CHECK FOR SPECIAL CHARACTERS IN FIRST NAME - ZERO TOLERANCE
    if (!/^[A-Za-z]+$/.test(firstName)) {
      console.error('❌❌❌ REJECTED: Special characters found in first name:', firstName);
      setErrors({ first_name: 'First name should contain only letters (A–Z). Special characters are NOT allowed.' });
      toast.error('❌ First name CANNOT contain special characters. Please use only letters.');
      setSubmitting(false);
      return;
    }

    console.log('✅ First name passed STRICT validation');

    // ============================================
    // STRICT LAST NAME VALIDATION - NO EXCEPTIONS
    // ============================================
    const lastName = values.last_name.trim();
    console.log('🔍 Validating last_name:', lastName);

    if (!lastName) {
      console.error('❌ REJECTED: Empty last name');
      setErrors({ last_name: 'Last name is required.' });
      toast.error('❌ Last name is required.');
      setSubmitting(false);
      return;
    }

    if (lastName.length < 2) {
      console.error('❌ REJECTED: Last name too short:', lastName);
      setErrors({ last_name: 'Last name must be at least 2 characters long.' });
      toast.error('❌ Last name must be at least 2 characters long.');
      setSubmitting(false);
      return;
    }

    // CHECK FOR NUMBERS IN LAST NAME - ZERO TOLERANCE
    if (/\d/.test(lastName)) {
      console.error('❌❌❌ REJECTED: Numbers found in last name:', lastName);
      setErrors({ last_name: 'Last name should contain only letters (A–Z). Numbers are NOT allowed.' });
      toast.error('❌ Last name CANNOT contain numbers. Please use only letters.');
      setSubmitting(false);
      return;
    }

    // CHECK FOR SPECIAL CHARACTERS IN LAST NAME - ZERO TOLERANCE
    if (!/^[A-Za-z]+$/.test(lastName)) {
      console.error('❌❌❌ REJECTED: Special characters found in last name:', lastName);
      setErrors({ last_name: 'Last name should contain only letters (A–Z). Special characters are NOT allowed.' });
      toast.error('❌ Last name CANNOT contain special characters. Please use only letters.');
      setSubmitting(false);
      return;
    }

    console.log('✅ Last name passed STRICT validation');

    // CRITICAL: Validate the form data against the schema
    try {
      console.log('🔐 Running schema validation...');
      await SignupValidationSchema.validate(values, { abortEarly: false });
      console.log('✅ Schema validation PASSED');
    } catch (validationError) {
      console.error('❌ Schema validation FAILED:', validationError.inner);
      
      const formErrors = {};
      validationError.inner.forEach(error => {
        console.error(`Field: ${error.path}, Message: ${error.message}`);
        formErrors[error.path] = error.message;
      });
      
      setErrors(formErrors);
      const errorMessage = Object.values(formErrors).join('\n');
      toast.error(`❌ Validation Errors:\n${errorMessage}`);
      setSubmitting(false);
      return; // STOP - Do not proceed
    }

    try {

      const { terms, first_name, last_name, confirm_password, user_type, ...rest } = values;

      const userData = {
        ...rest,
        firstName: first_name,
        lastName: last_name,
        confirmPassword: confirm_password,
        userType: user_type
      };

      console.log('📤 Sending registration data:', userData);

      const response = await registerUser(userData);

      console.log('✅ Registration response:', response);

      if (response.success) {

        console.log('🎉 Registration successful!');

        // SweetAlert Success Popup
        Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "Your PawWell account has been created successfully.",
          confirmButtonText: "Go to Login",
          confirmButtonColor: "#3085d6"
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/login', {
              state: {
                email: userData.email,
                registered: true
              }
            });
          }
        });

      } else {

        console.warn('⚠️ Registration response success=false:', response);

        toast.error(response.message || 'Registration failed. Please try again.');
      }

    } catch (error) {

      console.error('❌ Registration error:', error);
      setSubmitting(false); // Stop loading FIRST

      // Handle backend validation errors
      if (error.response?.data?.errors) {
        const formErrors = {};
        const backendErrors = error.response.data.errors;

        console.log('🔴 Backend errors received:', backendErrors);

        // Map backend field names to form field names
        const fieldMap = {
          'firstName': 'first_name',
          'lastName': 'last_name',
          'phoneNumber': 'phone_number'
        };

        // Handle errors object (with field arrays)
        if (typeof backendErrors === 'object') {
          Object.keys(backendErrors).forEach(key => {
            // Use field map for direct conversion
            const formFieldName = fieldMap[key] || key;
            const errorMsg = Array.isArray(backendErrors[key]) 
              ? backendErrors[key][0] 
              : backendErrors[key];
            formErrors[formFieldName] = errorMsg;
            console.log(`✏️ Mapped ${key} → ${formFieldName}: "${errorMsg}"`);
          });
        }

        console.log('💾 Final form errors:', formErrors);
        setErrors(formErrors);
        
        // Mark all error fields as touched so errors display
        const touchedErrorFields = {};
        Object.keys(formErrors).forEach(field => {
          touchedErrorFields[field] = true;
        });
        setTouched(touchedErrorFields);
        console.log('✅ Marked fields as touched:', Object.keys(touchedErrorFields));
        
      } else if (error.response?.data?.message) {
        // Show general error message
        toast.error(error.response.data.message || 'Registration failed. Please try again.');
      }

      toast.error(error.response?.data?.message || error.message || 'Registration failed. Please try again.');

    }

  };


  return (

    <div className="auth-page">

      <div className="signup-container">

        {/* Left Side */}

        <div className="signup-left">

          <div className="signup-brand">

            <div className="auth-logo">
              <span className="paw-icon">🐾</span>
              <span className="logo-text">PawWell</span>
            </div>

          </div>

          <h1 className="signup-heading">Join the PawWell<br />Family!</h1>

          <p className="signup-description">
            Create an account to manage your pets,<br />
            book services, and get expert advice.
          </p>

          <div className="signup-image">

            <div className="pet-image-circle">
              🐕
            </div>

          </div>

        </div>


        {/* Right Side */}

        <div className="signup-right">

          <div className="signup-form-container">

            <Formik
              initialValues={initialValues}
              validationSchema={SignupValidationSchema}
              onSubmit={handleSubmit}
              validateOnChange={true}
              validateOnBlur={true}
              validateOnMount={true}
            >

              {({ values, isSubmitting, errors, touched, isValid, dirty }) => {

                console.log('📋 Form State:', { errors, isValid, dirty, touched });

                return (

                <Form className="auth-form">

                  {/* Validation Error Summary - Show All Errors with Field Labels */}
                  {(Object.keys(errors).length > 0 || (touched && Object.keys(touched).length > 0 && !isValid)) && (
                    <div className="validation-error-summary" style={{
                      backgroundColor: '#fee',
                      border: '2px solid #fcc',
                      borderRadius: '6px',
                      padding: '14px 16px',
                      marginBottom: '16px',
                      color: '#c33'
                    }}>
                      <strong style={{ display: 'block', marginBottom: '12px', fontSize: '14px' }}>❌ Please fix the following errors:</strong>
                      {Object.keys(errors).length > 0 ? (
                        <ul style={{ margin: '0', paddingLeft: '20px', listStyle: 'none' }}>
                          {Object.entries(errors).map(([field, error]) => {
                            // Format field name for display
                            const fieldLabel = field
                              .replace(/_/g, ' ')
                              .split(' ')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ');
                            
                            return (
                              <li key={field} style={{ marginBottom: '8px', fontSize: '13px', lineHeight: '1.4' }}>
                                <strong>{fieldLabel}:</strong> {error}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p style={{ margin: '0', fontSize: '13px' }}>Please check all fields and try again.</p>
                      )}
                    </div>
                  )}

                  <div className="form-group">

                    <label htmlFor="first_name">
                      First Name 
                      {values.first_name && !errors.first_name && (
                        <span style={{ color: 'green', marginLeft: '8px' }}>✅</span>
                      )}
                      {errors.first_name && (
                        <span style={{ color: 'red', marginLeft: '8px' }}>❌</span>
                      )}
                    </label>

                    <Field name="first_name">

                      {({ field, form }) => (

                        <div>
                          <input
                            {...field}
                            type="text"
                            id="first_name"
                            placeholder="John"
                            className={`auth-input ${form.errors.first_name && form.touched.first_name ? 'input-error' : ''}`}
                            onChange={(e) => {
                              field.onChange(e);
                              form.setFieldTouched('first_name', true, false);
                            }}
                            onBlur={field.onBlur}
                          />
                          {form.errors.first_name && form.touched.first_name && (
                            <div style={{
                              color: '#dc3545',
                              fontSize: '12px',
                              marginTop: '4px',
                              fontWeight: '500'
                            }}>
                              {form.errors.first_name}
                            </div>
                          )}
                        </div>

                      )}

                    </Field>

                  </div>

                  <div className="form-group">

                    <label htmlFor="last_name">
                      Last Name 
                      {values.last_name && !errors.last_name && (
                        <span style={{ color: 'green', marginLeft: '8px' }}>✅</span>
                      )}
                      {errors.last_name && (
                        <span style={{ color: 'red', marginLeft: '8px' }}>❌</span>
                      )}
                    </label>

                    <Field name="last_name">

                      {({ field, form }) => (

                        <div>
                          <input
                            {...field}
                            type="text"
                            id="last_name"
                            placeholder="Doe"
                            className={`auth-input ${form.errors.last_name && form.touched.last_name ? 'input-error' : ''}`}
                            onChange={(e) => {
                              field.onChange(e);
                              form.setFieldTouched('last_name', true, false);
                            }}
                            onBlur={field.onBlur}
                          />
                          {form.errors.last_name && form.touched.last_name && (
                            <div style={{
                              color: '#dc3545',
                              fontSize: '12px',
                              marginTop: '4px',
                              fontWeight: '500'
                            }}>
                              {form.errors.last_name}
                            </div>
                          )}
                        </div>

                      )}

                    </Field>

                  </div>

                  <div className="form-group">

                    <label htmlFor="email">Email Address</label>

                    <Field name="email">

                      {({ field, form }) => (

                        <div>
                          <input
                            {...field}
                            type="email"
                            id="email"
                            placeholder="john.doe@example.com"
                            className={`auth-input ${form.errors.email && form.touched.email ? 'input-error' : ''}`}
                            onChange={(e) => {
                              field.onChange(e);
                              form.setFieldTouched('email', true, false);
                            }}
                            onBlur={field.onBlur}
                          />
                          {form.errors.email && form.touched.email && (
                            <div style={{
                              color: '#dc3545',
                              fontSize: '12px',
                              marginTop: '4px',
                              fontWeight: '500'
                            }}>
                              {form.errors.email}
                            </div>
                          )}
                        </div>

                      )}

                    </Field>

                  </div>





                  <div className="form-group">

                    <label htmlFor="password">Password</label>

                    <div className="input-with-icon">

                      <Field name="password">

                        {({ field, form }) => (

                          <div>
                            <input
                              {...field}
                              type={showPassword ? 'text' : 'password'}
                              id="password"
                              placeholder="••••••••"
                              className={`auth-input ${form.errors.password && form.touched.password ? 'input-error' : ''}`}
                              onChange={(e) => {
                                field.onChange(e);
                                form.setFieldTouched('password', true, false);
                                handlePasswordChange(e.target.value);
                              }}
                              onBlur={field.onBlur}
                            />
                            {form.errors.password && form.touched.password && (
                              <div style={{
                                color: '#dc3545',
                                fontSize: '12px',
                                marginTop: '4px',
                                fontWeight: '500'
                              }}>
                                {form.errors.password}
                              </div>
                            )}
                          </div>

                        )}

                      </Field>

                    </div>

                  </div>


                  <div className="form-group">

                    <label htmlFor="confirm_password">Confirm Password</label>

                    <Field name="confirm_password">

                      {({ field, form }) => (

                        <div>
                          <input
                            {...field}
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirm_password"
                            placeholder="••••••••"
                            className={`auth-input ${form.errors.confirm_password && form.touched.confirm_password ? 'input-error' : ''}`}
                            onChange={(e) => {
                              field.onChange(e);
                              form.setFieldTouched('confirm_password', true, false);
                            }}
                            onBlur={field.onBlur}
                          />
                          {form.errors.confirm_password && form.touched.confirm_password && (
                            <div style={{
                              color: '#dc3545',
                              fontSize: '12px',
                              marginTop: '4px',
                              fontWeight: '500'
                            }}>
                              {form.errors.confirm_password}
                            </div>
                          )}
                        </div>

                      )}

                    </Field>

                  </div>


                  <div className="form-group checkbox-group">

                    <label className="checkbox-label">

                      <Field type="checkbox" name="terms" />

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
                    disabled={isSubmitting || !isValid || !dirty}
                    title={!isValid ? 'Please fix all validation errors' : 'Create your account'}
                    onClick={(e) => {
                      console.log('🖱️ Button clicked');
                      console.log('FormState:', { isValid, dirty, errors, isSubmitting });
                      
                      if (!isValid) {
                        console.log('❌ Form is INVALID - blocking submission');
                        toast.error('❌ Please fix all validation errors before submitting.');
                        e.preventDefault();
                        return false;
                      }
                      
                      if (!dirty) {
                        console.log('❌ Form has not been modified - blocking submission');
                        toast.error('❌ Please fill in all required fields.');
                        e.preventDefault();
                        return false;
                      }

                      if (errors.first_name) {
                        console.log('❌ Full Name has errors:', errors.first_name);
                        toast.error('❌ ' + errors.first_name);
                        e.preventDefault();
                        return false;
                      }

                      console.log('✅ Form validation passed - allowing submission');
                    }}
                  >

                    {isSubmitting ? 'Creating Account...' : 'Register Account'}

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
