from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Student, Professor, Course, Attendance, Group

# تحيا عمي تبون
# تحيا الجزاىر

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name', 'section']


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'full_name']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        if not value.lower().endswith(('@esi-sba.dz', '@gmail.com')):
            raise serializers.ValidationError("Email must end with @esi-sba.dz or @gmail.com")
        return value

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def create(self, validated_data):
        username = validated_data['email'].split('@')[0]
        return User.objects.create_user(
            username=username,
            **validated_data
        )


class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    student_group = GroupSerializer(read_only=True)
    student_group_id = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        write_only=True,
        source='student_group'
    )

    class Meta:
        model = Student
        fields = ['id', 'user', 'student_group', 'student_group_id']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        username = user_data['email'].split('@')[0]
        user = User.objects.create_user(username=username, **user_data)
        return Student.objects.create(user=user, **validated_data)


class ProfessorSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Professor
        fields = ['id', 'user', 'module']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_data['username'] = user_data['email'].split("@")[0]
        user = User.objects.create_user(**user_data)
        return Professor.objects.create(user=user, **validated_data)


class CourseSerializer(serializers.ModelSerializer):
    professor = ProfessorSerializer(read_only=True)
    group = GroupSerializer(read_only=True)
    professor_id = serializers.PrimaryKeyRelatedField(
        queryset=Professor.objects.all(),
        write_only=True,
        source='professor'
    )
    group_id = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        write_only=True,
        source='group'
    )

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'date_time', 'module',
            'professor', 'professor_id', 'group', 'group_id'
        ]

    def create(self, validated_data):
        return Course.objects.create(**validated_data)


class AttendanceSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        write_only=True,
        source='student'
    )
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        write_only=True,
        source='course'
    )

    class Meta:
        model = Attendance
        fields = ['id','student', 'student_id', 'course', 'course_id', 'present_status', 'time']

    def create(self, validated_data):
        return Attendance.objects.create(**validated_data)
