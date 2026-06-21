import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList, TabParamList } from '../types';
import { Colors } from '../theme/colors';

import { CompaniesScreen } from '../screens/companies/CompaniesScreen';
import { CompanyFormScreen } from '../screens/companies/CompanyFormScreen';
import { CompanyDetailScreen } from '../screens/companies/CompanyDetailScreen';
import { EmployeeFormScreen } from '../screens/employees/EmployeeFormScreen';
import { EmployeeDetailScreen } from '../screens/employees/EmployeeDetailScreen';
import { CoursesScreen } from '../screens/courses/CoursesScreen';
import { CourseFormScreen } from '../screens/courses/CourseFormScreen';
import { CourseDetailScreen } from '../screens/courses/CourseDetailScreen';
import { TechniciansScreen } from '../screens/technicians/TechniciansScreen';
import { TechnicianFormScreen } from '../screens/technicians/TechnicianFormScreen';
import { CertificatesScreen } from '../screens/certificates/CertificatesScreen';
import { CertificateIssueScreen } from '../screens/certificates/CertificateIssueScreen';
import { CertificatePreviewScreen } from '../screens/certificates/CertificatePreviewScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: Colors.white },
  headerTintColor: Colors.primary.dark,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: Colors.gray[50] },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Companies: ['business', 'business-outline'],
            Courses: ['book', 'book-outline'],
            Certificates: ['ribbon', 'ribbon-outline'],
            Technicians: ['people', 'people-outline'],
          };
          const [filled, outline] = icons[route.name] ?? ['help-circle', 'help-circle-outline'];
          return (
            <Ionicons
              name={(focused ? filled : outline) as any}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: Colors.primary.main,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: {
          borderTopColor: Colors.border,
          backgroundColor: Colors.white,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Companies"
        component={CompaniesScreen}
        options={{ title: 'Empresas' }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesScreen}
        options={{ title: 'Cursos' }}
      />
      <Tab.Screen
        name="Certificates"
        component={CertificatesScreen}
        options={{ title: 'Certificados' }}
      />
      <Tab.Screen
        name="Technicians"
        component={TechniciansScreen}
        options={{ title: 'Resp. Técnicos' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={stackScreenOptions}>
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CompanyForm"
          component={CompanyFormScreen}
          options={({ route }) =>
            (route.params as any)?.companyId
              ? { title: 'Editar Empresa' }
              : { title: 'Nova Empresa' }
          }
        />
        <Stack.Screen
          name="CompanyDetail"
          component={CompanyDetailScreen}
          options={{ title: 'Detalhes da Empresa' }}
        />
        <Stack.Screen
          name="EmployeeForm"
          component={EmployeeFormScreen}
          options={({ route }) =>
            (route.params as any)?.employeeId
              ? { title: 'Editar Funcionário' }
              : { title: 'Novo Funcionário' }
          }
        />
        <Stack.Screen
          name="EmployeeDetail"
          component={EmployeeDetailScreen}
          options={{ title: 'Detalhes do Funcionário' }}
        />
        <Stack.Screen
          name="CourseForm"
          component={CourseFormScreen}
          options={({ route }) =>
            (route.params as any)?.courseId
              ? { title: 'Editar Curso' }
              : { title: 'Novo Curso' }
          }
        />
        <Stack.Screen
          name="CourseDetail"
          component={CourseDetailScreen}
          options={{ title: 'Detalhes do Curso' }}
        />
        <Stack.Screen
          name="TechnicianForm"
          component={TechnicianFormScreen}
          options={({ route }) =>
            (route.params as any)?.technicianId
              ? { title: 'Editar Responsável Técnico' }
              : { title: 'Novo Responsável Técnico' }
          }
        />
        <Stack.Screen
          name="TechnicianDetail"
          component={() => null}
          options={{ title: 'Responsável Técnico' }}
        />
        <Stack.Screen
          name="CertificateIssue"
          component={CertificateIssueScreen}
          options={{ title: 'Emitir Certificado' }}
        />
        <Stack.Screen
          name="CertificatePreview"
          component={CertificatePreviewScreen}
          options={{ title: 'Certificado' }}
        />
        <Stack.Screen
          name="CertificateDetail"
          component={CertificatePreviewScreen}
          options={{ title: 'Certificado' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
