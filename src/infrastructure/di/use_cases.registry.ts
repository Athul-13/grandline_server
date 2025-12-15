import { container } from 'tsyringe';
import { USE_CASE_TOKENS } from '../../application/di/tokens';
import { RegisterUserUseCase } from '../../application/use-cases/implementation/auth/register_user.use-case';
import { VerifyOtpUseCase } from '../../application/use-cases/implementation/auth/verify_otp.use-case';
import { ResendOtpUseCase } from '../../application/use-cases/implementation/auth/resend_otp.use-case';
import { LoginUserUseCase } from '../../application/use-cases/implementation/auth/login_user.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/implementation/auth/refresh_token.use-case';
import { LogoutUserUseCase } from '../../application/use-cases/implementation/auth/logout_user.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/implementation/auth/forgot_password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/implementation/auth/reset_password.use-case';
import { GetUserProfileUseCase } from '../../application/use-cases/implementation/user/get_user_profile.use-case';
import { UpdateUserProfileUseCase } from '../../application/use-cases/implementation/user/update_user_profile.use-case';
import { GenerateUploadUrlUseCase } from '../../application/use-cases/implementation/user/generate_upload_url.use-case';
import { GoogleAuthUseCase } from '../../application/use-cases/implementation/auth/google_auth.use-case';
import { SetupPasswordUseCase } from '../../application/use-cases/implementation/auth/setup_password.use-case';
import { LinkGoogleAccountUseCase } from '../../application/use-cases/implementation/auth/link_google_account.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/implementation/user/change_password.use-case';
import { GetUserByIdUseCase } from '../../application/use-cases/implementation/user/get_user_by_id.use-case';
import { ListUsersUseCase } from '../../application/use-cases/implementation/user/list_users.use-case';
import { ChangeUserStatusUseCase } from '../../application/use-cases/implementation/user/change_user_status.use-case';
import { ChangeUserRoleUseCase } from '../../application/use-cases/implementation/user/change_user_role.use-case';
import { GetUserStatisticsUseCase } from '../../application/use-cases/implementation/user/get_user_statistics.use-case';
import { DeleteUserAccountUseCase } from '../../application/use-cases/implementation/user/delete_user_account.use-case';
import { CreateDriverUseCase } from '../../application/use-cases/implementation/driver/create_driver.use-case';
import { ListDriversUseCase } from '../../application/use-cases/implementation/driver/list_drivers.use-case';
import { GetDriverByIdUseCase } from '../../application/use-cases/implementation/driver/get_driver_by_id.use-case';
import { UpdateDriverUseCase } from '../../application/use-cases/implementation/driver/update_driver.use-case';
import { UpdateDriverStatusUseCase } from '../../application/use-cases/implementation/driver/update_driver_status.use-case';
import { DeleteDriverUseCase } from '../../application/use-cases/implementation/driver/delete_driver.use-case';
import { LoginDriverUseCase } from '../../application/use-cases/implementation/driver/login_driver.use-case';
import { ChangeDriverPasswordUseCase } from '../../application/use-cases/implementation/driver/change_driver_password.use-case';
import { ForgotDriverPasswordUseCase } from '../../application/use-cases/implementation/driver/forgot_driver_password.use-case';
import { ResetDriverPasswordUseCase } from '../../application/use-cases/implementation/driver/reset_driver_password.use-case';
import { UpdateProfilePictureUseCase } from '../../application/use-cases/implementation/driver/update_profile_picture.use-case';
import { UpdateLicenseCardPhotoUseCase } from '../../application/use-cases/implementation/driver/update_license_card_photo.use-case';
import { UpdateOnboardingPasswordUseCase } from '../../application/use-cases/implementation/driver/update_onboarding_password.use-case';
import { GetDriverProfileUseCase } from '../../application/use-cases/implementation/driver/get_driver_profile.use-case';
import { GetDriverStatisticsUseCase } from '../../application/use-cases/implementation/driver/get_driver_statistics.use-case';
import { CompleteDriverOnboardingUseCase } from '../../application/use-cases/implementation/driver/complete_driver_onboarding.use-case';
import { GetDriverInfoUseCase } from '../../application/use-cases/implementation/driver/get_driver_info.use-case';
import { GenerateDriverUploadUrlUseCase } from '../../application/use-cases/implementation/driver/generate_driver_upload_url.use-case';
import { CreateVehicleTypeUseCase } from '../../application/use-cases/implementation/vehicle_type/create_vehicle_type.use-case';
import { GetVehicleTypeUseCase } from '../../application/use-cases/implementation/vehicle_type/get_vehicle_type.use-case';
import { GetAllVehicleTypesUseCase } from '../../application/use-cases/implementation/vehicle_type/get_all_vehicle_types.use-case';
import { UpdateVehicleTypeUseCase } from '../../application/use-cases/implementation/vehicle_type/update_vehicle_type.use-case';
import { DeleteVehicleTypeUseCase } from '../../application/use-cases/implementation/vehicle_type/delete_vehicle_type.use-case';
import { CreateVehicleUseCase } from '../../application/use-cases/implementation/vehicle/create_vehicle.use-case';
import { GetVehicleUseCase } from '../../application/use-cases/implementation/vehicle/get_vehicle.use-case';
import { GetAllVehiclesUseCase } from '../../application/use-cases/implementation/vehicle/get_all_vehicles.use-case';
import { GetVehiclesByTypeUseCase } from '../../application/use-cases/implementation/vehicle/get_vehicles_by_type.use-case';
import { UpdateVehicleUseCase } from '../../application/use-cases/implementation/vehicle/update_vehicle.use-case';
import { UpdateVehicleStatusUseCase } from '../../application/use-cases/implementation/vehicle/update_vehicle_status.use-case';
import { DeleteVehicleUseCase } from '../../application/use-cases/implementation/vehicle/delete_vehicle.use-case';
import { GetVehicleFilterOptionsUseCase } from '../../application/use-cases/implementation/vehicle/get_vehicle_filter_options.use-case';
import { GenerateVehicleImageUploadUrlUseCase } from '../../application/use-cases/implementation/vehicle/generate_vehicle_image_upload_url.use-case';
import { DeleteVehicleImagesUseCase } from '../../application/use-cases/implementation/vehicle/delete_vehicle_images.use-case';
import { CreateAmenityUseCase } from '../../application/use-cases/implementation/amenity/create_amenity.use-case';
import { GetAmenityUseCase } from '../../application/use-cases/implementation/amenity/get_amenity.use-case';
import { GetAllAmenitiesUseCase } from '../../application/use-cases/implementation/amenity/get_all_amenities.use-case';
import { GetPaidAmenitiesUseCase } from '../../application/use-cases/implementation/amenity/get_paid_amenities.use-case';
import { UpdateAmenityUseCase } from '../../application/use-cases/implementation/amenity/update_amenity.use-case';
import { DeleteAmenityUseCase } from '../../application/use-cases/implementation/amenity/delete_amenity.use-case';
import { CreateQuoteDraftUseCase } from '../../application/use-cases/implementation/quote/create_quote_draft.use-case';
import { UpdateQuoteDraftUseCase } from '../../application/use-cases/implementation/quote/update_quote_draft.use-case';
import { GetQuoteUseCase } from '../../application/use-cases/implementation/quote/get_quote.use-case';
import { GetQuotesListUseCase } from '../../application/use-cases/implementation/quote/get_quotes_list.use-case';
import { DeleteQuoteUseCase } from '../../application/use-cases/implementation/quote/delete_quote.use-case';
import { CalculateRoutesUseCase } from '../../application/use-cases/implementation/quote/calculate_routes.use-case';
import { GetEventTypesUseCase } from '../../application/use-cases/implementation/event_type/get_event_types.use-case';
import { CreateCustomEventTypeUseCase } from '../../application/use-cases/implementation/event_type/create_custom_event_type.use-case';
import { GetVehicleRecommendationsUseCase } from '../../application/use-cases/implementation/quote/get_vehicle_recommendations.use-case';
import { CalculateQuotePricingUseCase } from '../../application/use-cases/implementation/quote/calculate_quote_pricing.use-case';
import { SubmitQuoteUseCase } from '../../application/use-cases/implementation/quote/submit_quote.use-case';
import { GetAdminQuotesListUseCase } from '../../application/use-cases/implementation/quote/admin/get_admin_quotes_list.use-case';
import { GetAdminQuoteUseCase } from '../../application/use-cases/implementation/quote/admin/get_admin_quote.use-case';
import { UpdateQuoteStatusUseCase } from '../../application/use-cases/implementation/quote/admin/update_quote_status.use-case';
import { AssignDriverToQuoteUseCase } from '../../application/use-cases/implementation/quote/admin/assign_driver_to_quote.use-case';
import { RecalculateQuoteUseCase } from '../../application/use-cases/implementation/quote/admin/recalculate_quote.use-case';
import { GetPricingConfigUseCase } from '../../application/use-cases/implementation/pricing_config/get_pricing_config.use-case';
import { CreatePricingConfigUseCase } from '../../application/use-cases/implementation/pricing_config/create_pricing_config.use-case';
import { GetPricingConfigHistoryUseCase } from '../../application/use-cases/implementation/pricing_config/get_pricing_config_history.use-case';
import { ActivatePricingConfigUseCase } from '../../application/use-cases/implementation/pricing_config/activate_pricing_config.use-case';
import { CreateChatUseCase } from '../../application/use-cases/implementation/chat/create_chat.use-case';
import { GetUserChatsUseCase } from '../../application/use-cases/implementation/chat/get_user_chats.use-case';
import { GetChatByContextUseCase } from '../../application/use-cases/implementation/chat/get_chat_by_context.use-case';
import { SendMessageUseCase } from '../../application/use-cases/implementation/message/send_message.use-case';
import { GetChatMessagesUseCase } from '../../application/use-cases/implementation/message/get_chat_messages.use-case';
import { MarkMessageAsReadUseCase } from '../../application/use-cases/implementation/message/mark_message_as_read.use-case';
import { GetUnreadMessageCountUseCase } from '../../application/use-cases/implementation/message/get_unread_message_count.use-case';
import { GetTotalUnreadMessageCountUseCase } from '../../application/use-cases/implementation/message/get_total_unread_message_count.use-case';
import { CreateNotificationUseCase } from '../../application/use-cases/implementation/notification/create_notification.use-case';
import { GetUserNotificationsUseCase } from '../../application/use-cases/implementation/notification/get_user_notifications.use-case';
import { MarkNotificationAsReadUseCase } from '../../application/use-cases/implementation/notification/mark_notification_as_read.use-case';
import { MarkAllNotificationsAsReadUseCase } from '../../application/use-cases/implementation/notification/mark_all_notifications_as_read.use-case';
import { GetUnreadNotificationCountUseCase } from '../../application/use-cases/implementation/notification/get_unread_notification_count.use-case';
import { MarkChatNotificationsAsReadUseCase } from '../../application/use-cases/implementation/notification/mark_chat_notifications_as_read.use-case';
import { CreatePaymentIntentUseCase } from '../../application/use-cases/implementation/quote/create_payment_intent.use-case';
import { HandlePaymentWebhookUseCase } from '../../application/use-cases/implementation/quote/handle_payment_webhook.use-case';
import { CreateReservationUseCase } from '../../application/use-cases/implementation/reservation/create_reservation.use-case';
import { GetReservationUseCase } from '../../application/use-cases/implementation/reservation/get_reservation.use-case';
import { GetReservationsListUseCase } from '../../application/use-cases/implementation/reservation/get_reservations_list.use-case';
import { GetAdminReservationsListUseCase } from '../../application/use-cases/implementation/admin/reservation/get_admin_reservations_list.use-case';
import { GetAdminReservationUseCase } from '../../application/use-cases/implementation/admin/reservation/get_admin_reservation.use-case';
import { UpdateReservationStatusUseCase } from '../../application/use-cases/implementation/admin/reservation/update_reservation_status.use-case';
import { AddPassengersToReservationUseCase } from '../../application/use-cases/implementation/admin/reservation/add_passengers_to_reservation.use-case';
import { ChangeReservationDriverUseCase } from '../../application/use-cases/implementation/admin/reservation/change_reservation_driver.use-case';
import { AdjustReservationVehiclesUseCase } from '../../application/use-cases/implementation/admin/reservation/adjust_reservation_vehicles.use-case';
import { UpdateReservationItineraryUseCase } from '../../application/use-cases/implementation/admin/reservation/update_reservation_itinerary.use-case';
import { ProcessReservationRefundUseCase } from '../../application/use-cases/implementation/admin/reservation/process_reservation_refund.use-case';
import { CancelReservationUseCase } from '../../application/use-cases/implementation/admin/reservation/cancel_reservation.use-case';
import { AddReservationChargeUseCase } from '../../application/use-cases/implementation/admin/reservation/add_reservation_charge.use-case';
import { MarkChargeAsPaidUseCase } from '../../application/use-cases/implementation/admin/reservation/mark_charge_as_paid.use-case';
import { ExportReservationPDFUseCase } from '../../application/use-cases/implementation/admin/reservation/export_reservation_pdf.use-case';
import { ExportReservationCSVUseCase } from '../../application/use-cases/implementation/admin/reservation/export_reservation_csv.use-case';
import { CreateChargePaymentIntentUseCase } from '../../application/use-cases/implementation/reservation/create_charge_payment_intent.use-case';
import { GetDashboardStatsUseCase } from '../../application/use-cases/implementation/dashboard/get_dashboard_stats.use-case';
import { GetRecentActivityUseCase } from '../../application/use-cases/implementation/dashboard/get_recent_activity.use-case';
import { GetAdminDashboardAnalyticsUseCase } from '../../application/use-cases/implementation/dashboard/get_admin_dashboard_analytics.use-case';

/**
 * Registers all use case dependencies in the DI container
 * Use cases are application layer components that orchestrate business operations
 */
export function registerUseCases(): void {
  // Auth use cases
  container.register(USE_CASE_TOKENS.RegisterUserUseCase, RegisterUserUseCase);
  container.register(USE_CASE_TOKENS.VerifyOtpUseCase, VerifyOtpUseCase);
  container.register(USE_CASE_TOKENS.ResendOtpUseCase, ResendOtpUseCase);
  container.register(USE_CASE_TOKENS.LoginUserUseCase, LoginUserUseCase);
  container.register(USE_CASE_TOKENS.RefreshTokenUseCase, RefreshTokenUseCase);
  container.register(USE_CASE_TOKENS.LogoutUserUseCase, LogoutUserUseCase);
  container.register(USE_CASE_TOKENS.ForgotPasswordUseCase, ForgotPasswordUseCase);
  container.register(USE_CASE_TOKENS.ResetPasswordUseCase, ResetPasswordUseCase);
  container.register(USE_CASE_TOKENS.GoogleAuthUseCase, GoogleAuthUseCase);
  container.register(USE_CASE_TOKENS.SetupPasswordUseCase, SetupPasswordUseCase);
  container.register(USE_CASE_TOKENS.LinkGoogleAccountUseCase, LinkGoogleAccountUseCase);
  // User use cases
  container.register(USE_CASE_TOKENS.GetUserProfileUseCase, GetUserProfileUseCase);
  container.register(USE_CASE_TOKENS.UpdateUserProfileUseCase, UpdateUserProfileUseCase);
  container.register(USE_CASE_TOKENS.GenerateUploadUrlUseCase, GenerateUploadUrlUseCase);
  container.register(USE_CASE_TOKENS.ChangePasswordUseCase, ChangePasswordUseCase);
  container.register(USE_CASE_TOKENS.GetUserByIdUseCase, GetUserByIdUseCase);
  container.register(USE_CASE_TOKENS.ListUsersUseCase, ListUsersUseCase);
  container.register(USE_CASE_TOKENS.ChangeUserStatusUseCase, ChangeUserStatusUseCase);
  container.register(USE_CASE_TOKENS.ChangeUserRoleUseCase, ChangeUserRoleUseCase);
  container.register(USE_CASE_TOKENS.GetUserStatisticsUseCase, GetUserStatisticsUseCase);
  container.register(USE_CASE_TOKENS.DeleteUserAccountUseCase, DeleteUserAccountUseCase);
  // Driver use cases
  container.register(USE_CASE_TOKENS.CreateDriverUseCase, CreateDriverUseCase);
  container.register(USE_CASE_TOKENS.ListDriversUseCase, ListDriversUseCase);
  container.register(USE_CASE_TOKENS.GetDriverByIdUseCase, GetDriverByIdUseCase);
  container.register(USE_CASE_TOKENS.UpdateDriverUseCase, UpdateDriverUseCase);
  container.register(USE_CASE_TOKENS.UpdateDriverStatusUseCase, UpdateDriverStatusUseCase);
  container.register(USE_CASE_TOKENS.DeleteDriverUseCase, DeleteDriverUseCase);
  container.register(USE_CASE_TOKENS.LoginDriverUseCase, LoginDriverUseCase);
  container.register(USE_CASE_TOKENS.ChangeDriverPasswordUseCase, ChangeDriverPasswordUseCase);
  container.register(USE_CASE_TOKENS.ForgotDriverPasswordUseCase, ForgotDriverPasswordUseCase);
  container.register(USE_CASE_TOKENS.ResetDriverPasswordUseCase, ResetDriverPasswordUseCase);
  container.register(USE_CASE_TOKENS.UpdateProfilePictureUseCase, UpdateProfilePictureUseCase);
  container.register(USE_CASE_TOKENS.UpdateLicenseCardPhotoUseCase, UpdateLicenseCardPhotoUseCase);
  container.register(USE_CASE_TOKENS.UpdateOnboardingPasswordUseCase, UpdateOnboardingPasswordUseCase);
  container.register(USE_CASE_TOKENS.GetDriverProfileUseCase, GetDriverProfileUseCase);
  container.register(USE_CASE_TOKENS.GetDriverStatisticsUseCase, GetDriverStatisticsUseCase);
  container.register(USE_CASE_TOKENS.CompleteDriverOnboardingUseCase, CompleteDriverOnboardingUseCase);
  container.register(USE_CASE_TOKENS.GetDriverInfoUseCase, GetDriverInfoUseCase);
  container.register(USE_CASE_TOKENS.GenerateDriverUploadUrlUseCase, GenerateDriverUploadUrlUseCase);
  // Vehicle Type use cases
  container.register(USE_CASE_TOKENS.CreateVehicleTypeUseCase, CreateVehicleTypeUseCase);
  container.register(USE_CASE_TOKENS.GetVehicleTypeUseCase, GetVehicleTypeUseCase);
  container.register(USE_CASE_TOKENS.GetAllVehicleTypesUseCase, GetAllVehicleTypesUseCase);
  container.register(USE_CASE_TOKENS.UpdateVehicleTypeUseCase, UpdateVehicleTypeUseCase);
  container.register(USE_CASE_TOKENS.DeleteVehicleTypeUseCase, DeleteVehicleTypeUseCase);
  // Vehicle use cases
  container.register(USE_CASE_TOKENS.CreateVehicleUseCase, CreateVehicleUseCase);
  container.register(USE_CASE_TOKENS.GetVehicleUseCase, GetVehicleUseCase);
  container.register(USE_CASE_TOKENS.GetAllVehiclesUseCase, GetAllVehiclesUseCase);
  container.register(USE_CASE_TOKENS.GetVehiclesByTypeUseCase, GetVehiclesByTypeUseCase);
  container.register(USE_CASE_TOKENS.UpdateVehicleUseCase, UpdateVehicleUseCase);
  container.register(USE_CASE_TOKENS.UpdateVehicleStatusUseCase, UpdateVehicleStatusUseCase);
  container.register(USE_CASE_TOKENS.DeleteVehicleUseCase, DeleteVehicleUseCase);
  container.register(USE_CASE_TOKENS.GetVehicleFilterOptionsUseCase, GetVehicleFilterOptionsUseCase);
  container.register(USE_CASE_TOKENS.GenerateVehicleImageUploadUrlUseCase, GenerateVehicleImageUploadUrlUseCase);
  container.register(USE_CASE_TOKENS.DeleteVehicleImagesUseCase, DeleteVehicleImagesUseCase);
  // Amenity use cases
  container.register(USE_CASE_TOKENS.CreateAmenityUseCase, CreateAmenityUseCase);
  container.register(USE_CASE_TOKENS.GetAmenityUseCase, GetAmenityUseCase);
  container.register(USE_CASE_TOKENS.GetAllAmenitiesUseCase, GetAllAmenitiesUseCase);
  container.register(USE_CASE_TOKENS.GetPaidAmenitiesUseCase, GetPaidAmenitiesUseCase);
  container.register(USE_CASE_TOKENS.UpdateAmenityUseCase, UpdateAmenityUseCase);
  container.register(USE_CASE_TOKENS.DeleteAmenityUseCase, DeleteAmenityUseCase);
  // Quote use cases
  container.register(USE_CASE_TOKENS.CreateQuoteDraftUseCase, CreateQuoteDraftUseCase);
  container.register(USE_CASE_TOKENS.UpdateQuoteDraftUseCase, UpdateQuoteDraftUseCase);
  container.register(USE_CASE_TOKENS.GetQuoteUseCase, GetQuoteUseCase);
  container.register(USE_CASE_TOKENS.GetQuotesListUseCase, GetQuotesListUseCase);
  container.register(USE_CASE_TOKENS.DeleteQuoteUseCase, DeleteQuoteUseCase);
  container.register(USE_CASE_TOKENS.CalculateRoutesUseCase, CalculateRoutesUseCase);
  container.register(USE_CASE_TOKENS.GetVehicleRecommendationsUseCase, GetVehicleRecommendationsUseCase);
  container.register(USE_CASE_TOKENS.CalculateQuotePricingUseCase, CalculateQuotePricingUseCase);
  container.register(USE_CASE_TOKENS.SubmitQuoteUseCase, SubmitQuoteUseCase);
  // Event Type use cases
  container.register(USE_CASE_TOKENS.GetEventTypesUseCase, GetEventTypesUseCase);
  container.register(USE_CASE_TOKENS.CreateCustomEventTypeUseCase, CreateCustomEventTypeUseCase);
  // Admin Quote use cases
  container.register(USE_CASE_TOKENS.GetAdminQuotesListUseCase, GetAdminQuotesListUseCase);
  container.register(USE_CASE_TOKENS.GetAdminQuoteUseCase, GetAdminQuoteUseCase);
  container.register(USE_CASE_TOKENS.UpdateQuoteStatusUseCase, UpdateQuoteStatusUseCase);
  container.register(USE_CASE_TOKENS.AssignDriverToQuoteUseCase, AssignDriverToQuoteUseCase);
  container.register(USE_CASE_TOKENS.RecalculateQuoteUseCase, RecalculateQuoteUseCase);
  // Pricing Config use cases
  container.register(USE_CASE_TOKENS.GetPricingConfigUseCase, GetPricingConfigUseCase);
  container.register(USE_CASE_TOKENS.CreatePricingConfigUseCase, CreatePricingConfigUseCase);
  container.register(USE_CASE_TOKENS.GetPricingConfigHistoryUseCase, GetPricingConfigHistoryUseCase);
  container.register(USE_CASE_TOKENS.ActivatePricingConfigUseCase, ActivatePricingConfigUseCase);
  // Chat use cases
  container.register(USE_CASE_TOKENS.CreateChatUseCase, CreateChatUseCase);
  container.register(USE_CASE_TOKENS.GetUserChatsUseCase, GetUserChatsUseCase);
  container.register(USE_CASE_TOKENS.GetChatByContextUseCase, GetChatByContextUseCase);
  // Message use cases
  container.register(USE_CASE_TOKENS.SendMessageUseCase, SendMessageUseCase);
  container.register(USE_CASE_TOKENS.GetChatMessagesUseCase, GetChatMessagesUseCase);
  container.register(USE_CASE_TOKENS.MarkMessageAsReadUseCase, MarkMessageAsReadUseCase);
  container.register(USE_CASE_TOKENS.GetUnreadMessageCountUseCase, GetUnreadMessageCountUseCase);
  container.register(USE_CASE_TOKENS.GetTotalUnreadMessageCountUseCase, GetTotalUnreadMessageCountUseCase);
  // Notification use cases
  container.register(USE_CASE_TOKENS.CreateNotificationUseCase, CreateNotificationUseCase);
  container.register(USE_CASE_TOKENS.GetUserNotificationsUseCase, GetUserNotificationsUseCase);
  container.register(USE_CASE_TOKENS.MarkNotificationAsReadUseCase, MarkNotificationAsReadUseCase);
  container.register(USE_CASE_TOKENS.MarkAllNotificationsAsReadUseCase, MarkAllNotificationsAsReadUseCase);
  container.register(USE_CASE_TOKENS.GetUnreadNotificationCountUseCase, GetUnreadNotificationCountUseCase);
  container.register(USE_CASE_TOKENS.MarkChatNotificationsAsReadUseCase, MarkChatNotificationsAsReadUseCase);
  // Payment use cases
  container.register(USE_CASE_TOKENS.CreatePaymentIntentUseCase, CreatePaymentIntentUseCase);
  container.register(USE_CASE_TOKENS.HandlePaymentWebhookUseCase, HandlePaymentWebhookUseCase);
  // Reservation use cases
  container.register(USE_CASE_TOKENS.CreateReservationUseCase, CreateReservationUseCase);
  container.register(USE_CASE_TOKENS.GetReservationUseCase, GetReservationUseCase);
  container.register(USE_CASE_TOKENS.GetReservationsListUseCase, GetReservationsListUseCase);
  // Admin Reservation use cases
  container.register(USE_CASE_TOKENS.GetAdminReservationsListUseCase, GetAdminReservationsListUseCase);
  container.register(USE_CASE_TOKENS.GetAdminReservationUseCase, GetAdminReservationUseCase);
  container.register(USE_CASE_TOKENS.UpdateReservationStatusUseCase, UpdateReservationStatusUseCase);
  container.register(USE_CASE_TOKENS.AddPassengersToReservationUseCase, AddPassengersToReservationUseCase);
  container.register(USE_CASE_TOKENS.ChangeReservationDriverUseCase, ChangeReservationDriverUseCase);
  container.register(USE_CASE_TOKENS.AdjustReservationVehiclesUseCase, AdjustReservationVehiclesUseCase);
  container.register(USE_CASE_TOKENS.UpdateReservationItineraryUseCase, UpdateReservationItineraryUseCase);
    container.register(USE_CASE_TOKENS.ProcessReservationRefundUseCase, ProcessReservationRefundUseCase);
    container.register(USE_CASE_TOKENS.CancelReservationUseCase, CancelReservationUseCase);
    container.register(USE_CASE_TOKENS.AddReservationChargeUseCase, AddReservationChargeUseCase);
    container.register(USE_CASE_TOKENS.MarkChargeAsPaidUseCase, MarkChargeAsPaidUseCase);
    container.register(USE_CASE_TOKENS.ExportReservationPDFUseCase, ExportReservationPDFUseCase);
    container.register(USE_CASE_TOKENS.ExportReservationCSVUseCase, ExportReservationCSVUseCase);
    container.register(USE_CASE_TOKENS.CreateChargePaymentIntentUseCase, CreateChargePaymentIntentUseCase);
  // Dashboard use cases
  container.register(USE_CASE_TOKENS.GetDashboardStatsUseCase, GetDashboardStatsUseCase);
  container.register(USE_CASE_TOKENS.GetRecentActivityUseCase, GetRecentActivityUseCase);
  container.register(USE_CASE_TOKENS.GetAdminDashboardAnalyticsUseCase, GetAdminDashboardAnalyticsUseCase);
}

