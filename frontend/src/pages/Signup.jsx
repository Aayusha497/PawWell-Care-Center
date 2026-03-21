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
import Swal from "sweetalert2";


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

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: 'None',
    color: '#ccc'
  });

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

    try {

      const { terms, first_name, last_name, phone_number, confirm_password, user_type, ...rest } = values;

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

      if (error.errors) {

        const formErrors = {};

        Object.keys(error.errors).forEach(key => {

          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();

          formErrors[snakeKey] = error.errors[key];

        });

        setErrors(formErrors);

      }

      toast.error(error.message || 'Registration failed. Please try again.');

    } finally {

      setSubmitting(false);

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
              validationSchema={SignupSchema}
              onSubmit={handleSubmit}
            >

              {({ values, isSubmitting, setFieldValue, errors, touched }) => (

                <Form className="auth-form">

                  <div className="form-group">

                    <label htmlFor="first_name">Full Name</label>

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

                    <ErrorMessage name="first_name" component="div" className="error-message" />

                  </div>


                  <div className="form-group" style={{ display: 'none' }}>

                    <Field type="text" name="last_name" id="last_name" />

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

                    </div>

                    <ErrorMessage name="password" component="div" className="error-message" />

                  </div>


                  <div className="form-group">

                    <label htmlFor="confirm_password">Confirm Password</label>

                    <Field name="confirm_password">

                      {({ field }) => (

                        <input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirm_password"
                          placeholder="••••••••"
                          className="auth-input"
                        />

                      )}

                    </Field>

                    <ErrorMessage name="confirm_password" component="div" className="error-message" />

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
                    disabled={isSubmitting}
                  >

                    {isSubmitting ? 'Creating Account...' : 'Register Account'}

                  </button>

                </Form>

              )}

            </Formik>

          </div>

        </div>

      </div>

    </div>

  );

};

export default Signup;
