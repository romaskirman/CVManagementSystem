import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../shared/api/profile.api';
import { attributesApi } from '../../shared/api/attributes.api';
import { AddProfileAttributePanel } from '../../features/profile/components/AddProfileAttributePanel';
import { ProfileAttributeValueEditor } from '../../features/profile/components/ProfileAttributeValueEditor';
import { ProfileCvsSection } from '../../features/profile/components/ProfileCvsSection';
import { useProfileAutosave } from '../../features/profile/hooks/useProfileAutosave';
import {
  LibraryAttribute,
  ProfileDetails,
  ProfileSavePayload
} from '../../features/profile/types';
import * as React from 'react';

const BUILT_IN_NAMES = {
  firstName: 'First Name',
  lastName: 'Last Name',
  location: 'Location',
  photoUrl: 'Personal Photo'
} as const;

type BuiltInFieldKey = 'firstName' | 'lastName' | 'location' | 'photoUrl';

function adaptProfile(apiProfile: any): ProfileDetails {
  const firstNameAttr = apiProfile.attributes.find(
    (item: any) => item.attributeName === BUILT_IN_NAMES.firstName
  );
  const lastNameAttr = apiProfile.attributes.find(
    (item: any) => item.attributeName === BUILT_IN_NAMES.lastName
  );
  const locationAttr = apiProfile.attributes.find(
    (item: any) => item.attributeName === BUILT_IN_NAMES.location
  );
  const photoAttr = apiProfile.attributes.find(
    (item: any) => item.attributeName === BUILT_IN_NAMES.photoUrl
  );

  const infoAttributes = apiProfile.attributes.filter(
    (item: any) =>
      ![
        BUILT_IN_NAMES.firstName,
        BUILT_IN_NAMES.lastName,
        BUILT_IN_NAMES.location,
        BUILT_IN_NAMES.photoUrl
      ].includes(item.attributeName)
  );

  return {
    userId: apiProfile.user.id,
    version: apiProfile.version,
    me: {
      firstName: firstNameAttr?.stringValue ?? '',
      lastName: lastNameAttr?.stringValue ?? '',
      location: locationAttr?.stringValue ?? '',
      photoUrl: photoAttr?.imageUrl ?? ''
    },
    infoAttributes: infoAttributes.map((item: any) => ({
      id: item.id,
      attributeId: item.attributeId,
      attributeName: item.attributeName,
      attributeType: item.attributeType,
      category: item.category,
      isBuiltIn: item.isBuiltIn,
      stringValue: item.stringValue,
      textValue: item.textValue,
      numberValue: item.numberValue,
      booleanValue: item.booleanValue,
      dateValue: item.dateValue,
      imageUrl: item.imageUrl,
      optionId: item.optionId,
      optionLabel: item.optionLabel,
      periodStart: item.periodStart,
      periodEnd: item.periodEnd,
      options: []
    })),
    cvs: apiProfile.cvs ?? []
  };
}

export function MyProfilePage() {
  const queryClient = useQueryClient();
  const [profileState, setProfileState] = useState<ProfileDetails | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [editingBuiltIn, setEditingBuiltIn] = useState<BuiltInFieldKey | null>(null);

  const {
    data: profile,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => profileApi.getMine()
  });

  const { data: libraryAttributes } = useQuery({
    queryKey: ['attributes-library-for-profile'],
    queryFn: () => attributesApi.list({ pageSize: 100 })
  });

  useEffect(() => {
    if (profile) {
      setProfileState(adaptProfile(profile));
      setHasConflict(false);
    }
  }, [profile]);

  const builtInAttributeIds = useMemo(() => {
    const items = libraryAttributes?.items ?? [];

    return {
      firstName: items.find((item: any) => item.name === BUILT_IN_NAMES.firstName)?.id ?? null,
      lastName: items.find((item: any) => item.name === BUILT_IN_NAMES.lastName)?.id ?? null,
      location: items.find((item: any) => item.name === BUILT_IN_NAMES.location)?.id ?? null,
      photoUrl: items.find((item: any) => item.name === BUILT_IN_NAMES.photoUrl)?.id ?? null
    };
  }, [libraryAttributes]);

  const payload = useMemo(() => {
    if (!profileState) {
      return null;
    }

    const builtInAttributes: ProfileSavePayload['attributes'] = [];

    if (builtInAttributeIds.firstName) {
      builtInAttributes.push({
        attributeId: builtInAttributeIds.firstName,
        stringValue: profileState.me.firstName || null
      });
    }

    if (builtInAttributeIds.lastName) {
      builtInAttributes.push({
        attributeId: builtInAttributeIds.lastName,
        stringValue: profileState.me.lastName || null
      });
    }

    if (builtInAttributeIds.location) {
      builtInAttributes.push({
        attributeId: builtInAttributeIds.location,
        stringValue: profileState.me.location || null
      });
    }

    if (builtInAttributeIds.photoUrl) {
      builtInAttributes.push({
        attributeId: builtInAttributeIds.photoUrl,
        imageUrl: profileState.me.photoUrl || null
      });
    }

    const infoAttributes: ProfileSavePayload['attributes'] = profileState.infoAttributes.map(
      (item) => ({
        attributeId: item.attributeId,
        stringValue: item.stringValue ?? null,
        textValue: item.textValue ?? null,
        numberValue: item.numberValue ?? null,
        booleanValue: item.booleanValue ?? null,
        dateValue: item.dateValue ?? null,
        imageUrl: item.imageUrl ?? null,
        optionId: item.optionId ?? null,
        periodStart: item.periodStart ?? null,
        periodEnd: item.periodEnd ?? null
      })
    );

    const result: ProfileSavePayload = {
      version: profileState.version,
      attributes: [...builtInAttributes, ...infoAttributes]
    };

    return result;
  }, [profileState, builtInAttributeIds]);

  const { isDirty, isSaving, lastSavedAt, markDirty } = useProfileAutosave({
    enabled: Boolean(profileState && libraryAttributes),
    payload,
    onSaved: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
    onConflict: () => {
      setHasConflict(true);
    }
  });

  const updateMe = (patch: Partial<ProfileDetails['me']>) => {
    setProfileState((prev) =>
      prev
        ? {
            ...prev,
            me: {
              ...prev.me,
              ...patch
            }
          }
        : prev
    );
    markDirty();
  };

  const updateInfoAttribute = (attributeId: string, patch: Record<string, unknown>) => {
    setProfileState((prev) =>
      prev
        ? {
            ...prev,
            infoAttributes: prev.infoAttributes.map((item) =>
              item.attributeId === attributeId ? { ...item, ...patch } : item
            )
          }
        : prev
    );
    markDirty();
  };

  const removeInfoAttribute = async (attributeId: string) => {
    await profileApi.removeAttribute(attributeId);
    await queryClient.invalidateQueries({ queryKey: ['my-profile'] });
  };

  const addInfoAttribute = async (attributeId: string) => {
    const definition = (libraryAttributes?.items ?? []).find(
      (item: LibraryAttribute) => item.id === attributeId
    );

    if (!definition) {
      return;
    }

    const payload: {
      optionId?: string | null;
      booleanValue?: boolean | null;
      stringValue?: string | null;
      textValue?: string | null;
      numberValue?: number | null;
      dateValue?: string | null;
      imageUrl?: string | null;
      periodStart?: string | null;
      periodEnd?: string | null;
    } = {};

    if (definition.type === 'ONE_OF_MANY') {
      payload.optionId = definition.options?.[0]?.id ?? null;
    }

    const updatedProfile = await profileApi.upsertAttribute(attributeId, payload);

    setProfileState(adaptProfile(updatedProfile));
    await queryClient.invalidateQueries({ queryKey: ['my-profile'] });
  };

  if (isLoading) {
    return <div className="page-section">Loading profile...</div>;
  }

  if (isError) {
    return (
      <div className="page-section">
        Failed to load profile: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!profileState) {
    return <div className="page-section">Profile is empty.</div>;
  }

  const selectedAttributeIds = profileState.infoAttributes.map((item) => item.attributeId);

  const attributeDefinitionsById = new Map<string, LibraryAttribute>(
    (libraryAttributes?.items ?? []).map((item: LibraryAttribute) => [item.id, item])
  );

  const infoAttributesWithDefinitions = profileState.infoAttributes.map((item) => {
    const definition = attributeDefinitionsById.get(item.attributeId);

    return {
      ...item,
      options: definition?.options ?? []
    };
  });

  const renderBuiltInField = (key: BuiltInFieldKey, label: string) => {
    const isEditing = editingBuiltIn === key;
    const value = profileState.me[key] ?? '';

    return (
      <div style={{ position: 'relative' }}>
        <label>{label}</label>

        {isEditing ? (
          <input
            autoFocus
            value={value}
            onChange={(e) =>
              updateMe({ [key]: e.target.value } as Partial<ProfileDetails['me']>)
            }
            onBlur={() => setEditingBuiltIn(null)}
            style={{ width: '100%', marginTop: '6px' }}
          />
        ) : (
          <>
            <button
              type="button"
              aria-label={`Edit ${label}`}
              onClick={() => setEditingBuiltIn(key)}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: 'transparent',
                border: 'none',
                padding: 0,
                margin: 0,
                lineHeight: 1,
                cursor: 'pointer'
              }}
            >
              <span aria-hidden="true">✎</span>
            </button>

            <div style={{ marginTop: '6px', paddingRight: '24px' }}>
              {value || '—'}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <section className="page-section">
      <div className="page-header">
        <h1>My profile</h1>
        <p>Auto-save is enabled and runs every few seconds.</p>
      </div>

      <div className="inline-actions">
        <span>{isSaving ? 'Saving...' : isDirty ? 'Unsaved changes' : 'Saved'}</span>
        {lastSavedAt && <span>Last saved: {new Date(lastSavedAt).toLocaleTimeString()}</span>}
      </div>

      {hasConflict && (
        <div className="conflict-banner">
          Your profile was changed elsewhere. Reload the page and review the latest version.
        </div>
      )}

      <section className="card-block form-section">
        <h2>Me</h2>

        <div className="form-grid">
          {renderBuiltInField('firstName', 'First name')}
          {renderBuiltInField('lastName', 'Last name')}
          {renderBuiltInField('location', 'Location')}
          {renderBuiltInField('photoUrl', 'Personal photo URL')}
        </div>
      </section>

      <section className="form-section">
        <div className="section-header-inline">
          <h2>Info</h2>
        </div>

        <div className="stack-list">
          {infoAttributesWithDefinitions.map((item) => (
            <ProfileAttributeValueEditor
              key={item.attributeId}
              item={item}
              onChange={(patch) => updateInfoAttribute(item.attributeId, patch)}
              onRemove={() => void removeInfoAttribute(item.attributeId)}
            />
          ))}
        </div>
      </section>

      <AddProfileAttributePanel
        libraryAttributes={(libraryAttributes?.items ?? []).filter(
          (item: any) => !item.isBuiltIn
        )}
        selectedAttributeIds={selectedAttributeIds}
        onAdd={(attributeId) => void addInfoAttribute(attributeId)}
      />

      <ProfileCvsSection items={profileState.cvs ?? []} />
    </section>
  );
}
