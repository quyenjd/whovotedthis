import Poll, { PollOption, PollStage } from '../../utils/Poll';

/**
 * Props of all child elements of poll body.
 */
interface PollBodyElementProps {
    poll: Poll;
    stage: PollStage;
    options: PollOption[];
    voted: boolean;
    itemRefresher: () => void;
    listRefresher: () => void;
}

export default PollBodyElementProps;
