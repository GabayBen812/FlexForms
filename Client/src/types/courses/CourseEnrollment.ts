type KidReference =
  | string
  | {
      _id: string;
      firstname?: string;
      lastname?: string;
    };

export interface CourseEnrollment {
  _id?: string;
  id?: string;
  organizationId: string;
  courseId: string;
  kidId: KidReference;
  enrollmentDate: string;
  kid?: {
    _id: string;
    firstname?: string;
    lastname?: string;
  };
  course?: {
    _id: string;
    name: string;
  };
}

