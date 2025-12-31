import { ActorType } from "../../../../shared/constants";
import { GetTicketsByActorResponse } from "../../../dtos/ticket.dto";

/**
 * Interface for getting tickets by actor
 */
export interface IGetTicketsByActorUseCase {
    execute(
        actorType: ActorType,
        actorId: string,
        requesterId: string
    ): Promise<GetTicketsByActorResponse>
}