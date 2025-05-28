from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.models import User
from rest_framework import generics,viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .serializers import UserSerializer,StudentSerializer,CourseSerializer,GroupSerializer,AttendanceSerializer,ProfessorSerializer
from rest_framework.permissions import IsAuthenticated,AllowAny
from .models import Student,Course,Group,Attendance,Professor
from .permissions import IsProfessorOrAdmin
from .filters import CourseFilter ,AttendanceFilter,StudentFilter;
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework.decorators import action
from rest_framework import status


# Student registration endpoint
class StudentRegisterView(generics.CreateAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes=[AllowAny]


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permisson_classes = [IsProfessorOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_class =StudentFilter

# Professor registration endpoint
class ProfessorRegisterView(generics.CreateAPIView):
    queryset = Professor.objects.all()
    serializer_class = ProfessorSerializer
    permission_classes=[AllowAny]


class ProfessorViewSet(viewsets.ModelViewSet):
    queryset = Professor.objects.all()
    serializer_class = ProfessorSerializer
    permission_classes = [IsProfessorOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['module']  # Filter by module name

# Course registration endpoint
#the filter is by module name like this: /home/courses/?module=module_name
#the frontend will filter the courses by module name and display them in the frontend
#the filter is done by the CourseFilter class in the filters.py file
#the filter is by professor email like this: /home/courses/?professor=professor_email
#if you want to filter by group name and professor email you can do it like this: /home/courses/?group_name=group_name&professor_email=professor_email
#the filter is by section name like this: /home/courses/?section_name=section_name
#you can filter by any of the fields just fill the query params in the url
#you can filter the other class too (student,professor and attendance) by the same way
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsProfessorOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_class = CourseFilter


#group registration endpoint
class GroupViewSet(viewsets.ModelViewSet):
    queryset=Group.objects.all()
    serializer_class=GroupSerializer
    permission_classes=[IsProfessorOrAdmin]
#the attendance filter is by group name like this: /home/attendance/?group_name=group_name
#the filter is by section name like this: /home/attendance/?section_name=section_name
#the filter is by professor email like this: /home/attendance/?professor_email=professor_email
#the filter is by module name like this: /home/attendance/?module_name=module_name
#the filter is by present status like this: /home/attendance/?present_status=present_status
#the filter is by student email like this: /home/attendance/?student_email=student_email
#you can filter by any of the fields just fill the query params in the url

#Attendance registration endpoint
# class AttendanceViewSet(viewsets.ModelViewSet):
#     queryset=Attendance.objects.all()
#     serializer_class=AttendanceSerializer
#     permission_classes=[IsProfessorOrAdmin]
#     filter_backends=[DjangoFilterBackend]
#     filterset_class=AttendanceFilter




class AdminListView(APIView):
    permission_classes = [IsAuthenticated]  # Optional: or use AllowAny

    def get(self, request):
        admins = User.objects.filter(is_superuser=True)
        serializer = UserSerializer(admins, many=True)
        return Response(serializer.data)

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsProfessorOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_class = AttendanceFilter

    @action(
        detail=True,
        methods=['patch'],               # allow PATCH to partially update
        url_path='update-status',       # /attendance/{pk}/update-status/
        permission_classes=[IsProfessorOrAdmin]
    )
    def update_status(self, request, pk=None):
        """
        PATCH /attendance/{id}/update-status/
        { "present_status": "Present" }
        """
        attendance = self.get_object()
        new_status = request.data.get('present_status')
        if not new_status:
            return Response(
                {"detail": "present_status is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        attendance.present_status = new_status
        attendance.save()

        # Return the full attendance representation
        serializer = self.get_serializer(attendance)
        return Response(serializer.data, status=status.HTTP_200_OK)