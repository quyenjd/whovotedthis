import Poll, { PollOption, PollStage } from '../../utils/Poll';

interface PollBodyElementProps {
    poll: Poll;
    stage: PollStage;
    options: PollOption[];
    voted: boolean;
    itemRefresher: () => void;
    listRefresher: () => void;
}

export default PollBodyElementProps;
