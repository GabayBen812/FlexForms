import mongoose, { Types } from 'mongoose';
import * as dotenv from 'dotenv';
import { Parent, ParentDocument, ParentSchema } from '../../nestjs/schemas/parent.schema';
import { Kid, KidDocument, KidSchema } from '../../nestjs/schemas/kid.schema';
import { Contact, ContactSchema, ContactType } from '../../nestjs/schemas/contact.schema';
import {
  ContactRelation,
  ContactRelationship,
  ContactRelationshipSchema,
} from '../../nestjs/schemas/contact-relationship.schema';
import { namespaceDynamicFields } from '../../nestjs/utils/contact-dynamic-fields.util';

type Stats = {
  parentsProcessed: number;
  parentContactsCreated: number;
  kidsProcessed: number;
  kidContactsCreated: number;
  relationshipsCreated: number;
};

dotenv.config();

const MONGODB_URI = (process.env.MONGODB_URI || '').trim();

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

const ParentModel = mongoose.model<ParentDocument>(Parent.name, ParentSchema);
const KidModel = mongoose.model<KidDocument>(Kid.name, KidSchema);
const ContactModel = mongoose.model(Contact.name, ContactSchema);
const ContactRelationshipModel = mongoose.model(ContactRelationship.name, ContactRelationshipSchema);

const stats: Stats = {
  parentsProcessed: 0,
  parentContactsCreated: 0,
  kidsProcessed: 0,
  kidContactsCreated: 0,
  relationshipsCreated: 0,
};

const ensureContactForParent = async (parent: ParentDocument): Promise<ParentDocument> => {
  if (parent.contactId) {
    return parent;
  }

  const namespacedDynamicFields = namespaceDynamicFields(parent.dynamicFields as Record<string, unknown>, 'parent');

  const contact = await ContactModel.create({
    firstname: parent.firstname,
    lastname: parent.lastname,
    type: ContactType.PARENT,
    organizationId: parent.organizationId,
    idNumber: parent.idNumber,
    dynamicFields: namespacedDynamicFields ?? {},
  });

  parent.contactId = contact._id as Types.ObjectId;
  await parent.save();

  stats.parentContactsCreated += 1;

  return parent;
};

const ensureContactForKid = async (kid: KidDocument): Promise<KidDocument> => {
  if (kid.contactId) {
    return kid;
  }

  const namespacedDynamicFields = namespaceDynamicFields(kid.dynamicFields as Record<string, unknown>, 'kid');

  const contact = await ContactModel.create({
    firstname: kid.firstname,
    lastname: kid.lastname,
    type: ContactType.KID,
    organizationId: kid.organizationId,
    idNumber: kid.idNumber,
    address: kid.address,
    dynamicFields: namespacedDynamicFields ?? {},
  });

  kid.contactId = contact._id as Types.ObjectId;
  await kid.save();

  stats.kidContactsCreated += 1;

  return kid;
};

const upsertRelationship = async (sourceId: Types.ObjectId, targetId: Types.ObjectId, relation: ContactRelation) => {
  await ContactRelationshipModel.updateOne(
    {
      sourceContactId: sourceId,
      targetContactId: targetId,
    },
    {
      $set: {
        sourceContactId: sourceId,
        targetContactId: targetId,
        relation,
      },
    },
    { upsert: true },
  ).exec();

  stats.relationshipsCreated += 1;
};

const syncRelationships = async (parent: ParentDocument, kid: KidDocument) => {
  if (!parent.contactId || !kid.contactId) {
    return;
  }

  await upsertRelationship(parent.contactId, kid.contactId, ContactRelation.PARENT);
  await upsertRelationship(kid.contactId, parent.contactId, ContactRelation.CHILD);
};

const backfillContacts = async () => {
  await mongoose.connect(MONGODB_URI);

  const parents = await ParentModel.find().exec();
  const kids = await KidModel.find().exec();

  for (const parent of parents) {
    stats.parentsProcessed += 1;
    await ensureContactForParent(parent);
  }

  for (const kid of kids) {
    stats.kidsProcessed += 1;
    await ensureContactForKid(kid);
  }

  for (const parent of parents) {
    if (!parent.linked_kids?.length || !parent.contactId) {
      continue;
    }

    const kidDocuments = await KidModel.find({ _id: { $in: parent.linked_kids } }).exec();

    for (const kid of kidDocuments) {
      await syncRelationships(parent, kid);
    }
  }
};

backfillContacts()
  .then(() => {
    console.log('Backfill completed successfully with stats:', stats);
    process.exit(0);
  })
  .catch(error => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });


