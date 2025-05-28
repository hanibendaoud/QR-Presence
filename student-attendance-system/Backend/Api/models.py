from django.db import models
from django.contrib.auth.models import User


def get_role(self):
    if hasattr(self, 'student'):
        return 'student'
    elif hasattr(self, 'professor'):
        return 'professor'
    else:
        return 'admin'  # or 'staff', etc.

# Monkey-patch the method into the User model
User.add_to_class('get_role', get_role)


class Group(models.Model):
    name = models.CharField(max_length=50, help_text="Group name", default="DefaultGroupName")
    section = models.CharField(max_length=50)


class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    student_group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        help_text="Group of the student",
        related_name='students',
        null=True
    )

    class Meta:
        verbose_name = 'Student'
        verbose_name_plural = 'Students'

    def __str__(self):
        return self.user.username

    def delete(self, *args, **kwargs):
        self.user.delete()
        super().delete(*args, **kwargs)


class Professor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    module = models.CharField(max_length=50, help_text="Module name")

    class Meta:
        verbose_name = 'Professor'
        verbose_name_plural = 'Professors'

    def __str__(self):
        return self.user.username

    def delete(self, *args, **kwargs):
        self.user.delete()
        super().delete(*args, **kwargs)


class Course(models.Model):
    name = models.CharField(max_length=50, help_text="Course name")
    code = models.CharField(max_length=20, unique=True, help_text="Course code e.g., CS101")
    professor = models.ForeignKey(Professor, on_delete=models.CASCADE, help_text="Professor teaching the course")
    module = models.CharField(max_length=50, help_text="Module name", default="DefaultModuleName")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, help_text="Group for the course", null=True, default=None)
    date_time = models.DateTimeField(help_text="Date and time when the course starts", null=True, default=None)

    class Meta:
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
        ordering = ['name']

    def __str__(self):
        return f"{self.code} - {self.name} - {self.professor.user.username}"


class Attendance(models.Model):
    id = models.AutoField(primary_key=True)  
    student = models.ForeignKey(Student, on_delete=models.CASCADE, help_text="Student attending the class")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, help_text="Course for which attendance is taken")
    time = models.DateTimeField()
    present_status = models.CharField(max_length=30, default='Absent', help_text='The attendance status')



    class Meta:
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendance Records'

    def __str__(self):
        return f"{self.student.user.username} - {self.course.code} - {self.present_status}"
