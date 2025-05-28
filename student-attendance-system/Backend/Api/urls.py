from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentRegisterView,
    ProfessorRegisterView,
    StudentViewSet,
    ProfessorViewSet, 
    CourseViewSet,
    GroupViewSet,
    AttendanceViewSet,  
    
    )

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from django.urls import path
from .views import AdminListView

#The router will automatically generate the URL for the StudentViewSet, which will include the list and detail routes.
# For example, the list route will be /students/ and the detail route will be /students/<id>/.
# The <id> part will be replaced with the actual ID of the student.
# The router will also generate the URL for the StudentViewSet's actions, such as create, retrieve, update, and destroy.
#And the same for all the other viewsets.



router=DefaultRouter()
router.register(r'students',StudentViewSet,basename='student')
router.register(r'professors',ProfessorViewSet,basename='professor')
router.register(r'courses',CourseViewSet,basename='course')
router.register(r'groups',GroupViewSet,basename='group')
router.register(r'attendance',AttendanceViewSet,basename='attendance')



# Those are the endpoints that will be used in the frontend to register the students and professors
# I used the viewsets because they are more flexible and allow you to define the endpoints in a more organized way.
# In the home/include(router.urls) the router will automatically generate the URL for the ViewSets,
#  which will include the list and detail routes.


urlpatterns =[
    path('register/student/',StudentRegisterView.as_view(),name='student-register'),
    path('register/professor/',ProfessorRegisterView.as_view(),name='professor-register'),
    path('user/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('user/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('home/', include(router.urls)),
    path('admins/', AdminListView.as_view(), name='admin-list'),
]
