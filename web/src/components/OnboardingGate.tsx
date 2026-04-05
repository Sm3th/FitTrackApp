import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import OnboardingWizard from './OnboardingWizard';

const OnboardingGate: React.FC = () => {
  const location = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('token');
    const isDone     = !!localStorage.getItem('onboarding_complete');
    const isAuthPage = ['/login', '/register'].includes(location.pathname);

    setShow(isLoggedIn && !isDone && !isAuthPage);
  }, [location.pathname]);

  if (!show) return null;

  return (
    <OnboardingWizard
      onComplete={() => setShow(false)}
    />
  );
};

export default OnboardingGate;
