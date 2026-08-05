import { NotFoundError } from '../../../common/errors/NotFoundError';
import { RequestUser } from '../../../common/types/request-user.type';
import { UsersRepository } from '../../users/users.repository';
import { SalesforceClient } from './salesforce.client';
import { ExportSalesforceProfileInput } from './salesforce.schemas';

export class SalesforceService {
  constructor(
    private readonly salesforceClient: SalesforceClient,
    private readonly usersRepository: UsersRepository
  ) {}

  private getProfileValue(
    profile: NonNullable<Awaited<ReturnType<UsersRepository['findCandidateProfileByUserId']>>>,
    attributeName: string
  ) {
    const item = profile.attributeValues.find((value) => value.attribute.name === attributeName);
    return item?.stringValue ?? item?.textValue ?? '';
  }

  async exportCurrentUserToSalesforce(
    currentUser: RequestUser,
    payload: ExportSalesforceProfileInput
  ) {
    console.log('[SalesforceService] export start', {
      userId: currentUser.id,
      email: (currentUser as any).email,
      roles: currentUser.roles,
      payload
    });

    const user = await this.usersRepository.findUserById(currentUser.id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    console.log('[SalesforceService] user loaded', { userId: user.id, email: user.email });

    const profile = await this.usersRepository.findCandidateProfileByUserId(currentUser.id);

    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    console.log('[SalesforceService] profile loaded', {
      profileId: profile.id,
      attributesCount: profile.attributeValues.length
    });

    const firstName = this.getProfileValue(profile, 'First Name');
    const lastName = this.getProfileValue(profile, 'Last Name') || 'User';
    const location = this.getProfileValue(profile, 'Location');

    console.log('[SalesforceService] name values', {
      firstName,
      lastName,
      location
    });

    const accountId = await this.salesforceClient.createAccount({
      accountName: payload.company.trim()
    });

    const description = [
      payload.notes?.trim() || '',
      location ? `Location: ${location}` : '',
      `Source user id: cms856ej20000y3ek6csv76ce`,
      `Roles: ${(currentUser.roles ?? []).join(', ')}`
    ]
      .filter(Boolean)
      .join('\n');

    const contactId = await this.salesforceClient.createOrResolveContact({
      firstName: firstName || 'Unknown',
      lastName,
      email: user.email,
      phone: payload.phone ?? null,
      description,
      accountId
    });

    console.log('[SalesforceService] created/linked records', {
      accountId,
      contactId
    });

    await this.usersRepository.updateSalesforceSync(currentUser.id, {
      salesforceAccountId: accountId,
      salesforceContactId: contactId
    });

    console.log('[SalesforceService] sync saved in db', {
      userId: currentUser.id,
      salesforceAccountId: accountId,
      salesforceContactId: contactId
    });

    return {
      salesforceAccountId: accountId,
      salesforceContactId: contactId,
      instanceUrl: this.salesforceClient.getInstanceUrl() ?? '',
      refreshToken: this.salesforceClient.getRefreshToken()
    };
  }
}
