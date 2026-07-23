import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layout/RootLayout';
import { HomePage } from '../../pages/public/HomePage';
import { PositionsPage } from '../../pages/public/PositionsPage';
import { PositionDetailsPage } from '../../pages/public/PositionDetailsPage';
import { SignInPage } from '../../pages/public/SignInPage';
import { RegisterPage } from '../../pages/public/RegisterPage';
import { SearchResultsPage } from '../../pages/common/SearchResultsPage';
import { NotFoundPage } from '../../pages/common/NotFoundPage';
import { AuthGuard } from './guards/AuthGuard';
import { CandidateGuard } from './guards/CandidateGuard';
import { RecruiterGuard } from './guards/RecruiterGuard';
import { AdminGuard } from './guards/AdminGuard';
import { MyProfilePage } from '../../pages/candidate/MyProfilePage';
import { MyProjectsPage } from '../../pages/candidate/MyProjectsPage';
import { MyCvsPage } from '../../pages/candidate/MyCvsPage';
import { CvEditorPage } from '../../pages/candidate/CvEditorPage';
import { AttributeLibraryPage } from '../../pages/recruiter/AttributeLibraryPage';
import { AttributeEditorPage } from '../../pages/recruiter/AttributeEditorPage';
import { PositionEditorPage } from '../../pages/recruiter/PositionEditorPage';
import { PositionCvsPage } from '../../pages/recruiter/PositionCvsPage';
import { CandidateCvViewPage } from '../../pages/recruiter/CandidateCvViewPage';
import { UsersPage } from '../../pages/admin/UsersPage';
import { UserDetailsPage } from '../../pages/admin/UserDetailsPage';
import * as React from 'react';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'signin', element: <SignInPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'positions', element: <PositionsPage /> },
      { path: 'positions/:positionId', element: <PositionDetailsPage /> },
      { path: 'search', element: <SearchResultsPage /> },
      {
        element: <AuthGuard />,
        children: [
          {
            element: <CandidateGuard />,
            children: [
              { path: 'profile', element: <MyProfilePage /> },
              { path: 'projects', element: <MyProjectsPage /> },
              { path: 'cvs', element: <MyCvsPage /> },
              { path: 'cvs/new', element: <CvEditorPage /> },
              { path: 'cvs/:cvId', element: <CvEditorPage /> }
            ]
          },
          {
            element: <RecruiterGuard />,
            children: [
              { path: 'recruiter/attributes', element: <AttributeLibraryPage /> },
              { path: 'recruiter/attributes/new', element: <AttributeEditorPage /> },
              { path: 'recruiter/attributes/:attributeId/edit', element: <AttributeEditorPage /> },
              { path: 'recruiter/positions/new', element: <PositionEditorPage /> },
              { path: 'recruiter/positions/:positionId/edit', element: <PositionEditorPage /> },
              { path: 'recruiter/positions/:positionId/cvs', element: <PositionCvsPage /> },
              { path: 'recruiter/cvs/:cvId', element: <CandidateCvViewPage /> }
            ]
          },
          {
            element: <AdminGuard />,
            children: [
              { path: 'admin/users', element: <UsersPage /> },
              { path: 'admin/users/:userId', element: <UserDetailsPage /> }
            ]
          }
        ]
      }
    ]
  }
]);
