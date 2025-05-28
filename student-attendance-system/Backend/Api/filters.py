import django_filters
from .models import Course, Attendance , Student

class CourseFilter(django_filters.FilterSet):
    group_name = django_filters.CharFilter(field_name='group__name', lookup_expr='exact')
    professor_email = django_filters.CharFilter(field_name='professor__user__email', lookup_expr='exact')
    section_name = django_filters.CharFilter(field_name='group__section', lookup_expr='exact')
    class Meta:
        model = Course
        fields = ['module', 'group_name', 'professor_email', 'section_name']

class AttendanceFilter(django_filters.FilterSet):
    # Existing filters
    group_name = django_filters.CharFilter(field_name='course__group__name', lookup_expr='icontains')
    section_name = django_filters.CharFilter(field_name='course__group__section', lookup_expr='icontains')
    professor_email = django_filters.CharFilter(field_name='course__professor__user__email', lookup_expr='exact')
    module_name = django_filters.CharFilter(field_name='course__module', lookup_expr='exact')
    present_status = django_filters.CharFilter(field_name='present_status', lookup_expr='exact')
    student_email = django_filters.CharFilter(field_name='student__user__email', lookup_expr='exact')

    # New filter for course_id
    course_id = django_filters.NumberFilter(field_name='course__id', lookup_expr='exact')

    class Meta:
        model = Attendance
        fields = ['group_name', 'section_name', 'professor_email', 'module_name', 'present_status', 'student_email', 'course_id']

class StudentFilter(django_filters.FilterSet):
    group_name = django_filters.CharFilter(field_name='student_group__name', lookup_expr='exact')
    section_name = django_filters.CharFilter(field_name='student_group__section', lookup_expr='exact')
    class Meta:
        model=Student
        fields=['group_name','section_name']