from django.contrib import admin
from .models import Student, Professor, Course, Attendance, Group
# Register your models here.
admin.site.register(Group)
admin.site.register(Student)
admin.site.register(Professor)
admin.site.register(Course)
admin.site.register(Attendance)
